import _ from "lodash";
import { templateTypeName, friendlyName } from "@forestryio/graphql-helpers";
import { gql } from "../gql";
import { sequential } from "../util";

import { text } from "../fields/text";
import { list } from "../fields/list";
import { select } from "../fields/select";
import { blocks } from "../fields/blocks";
import { textarea } from "../fields/textarea";
import { fieldGroup } from "../fields/field-group";
import { fieldGroupList } from "../fields/field-group-list";
import { boolean } from "../fields/boolean";
import { datetime } from "../fields/datetime";
import { file } from "../fields/file";
import { imageGallery } from "../fields/image-gallery";
import { number } from "../fields/number";
import { tag_list } from "../fields/tag-list";

import type {
  DocumentNode,
  UnionTypeDefinitionNode,
  ObjectTypeDefinitionNode,
  EnumTypeDefinitionNode,
  InputObjectTypeDefinitionNode,
  FieldDefinitionNode,
  InputValueDefinitionNode,
  ScalarTypeDefinitionNode,
  InterfaceTypeDefinitionNode,
} from "graphql";
import type { TemplateData, DirectorySection, Section } from "../types";
import type { Cache } from "../cache";
import type { Field } from "../fields";

/**
 *
 * ### Schema Builder
 *
 * Build the schema for a given app, this is the main entrypoint into the
 * build process, it generates a schema based on the `.tina` configuration. The schema can be
 * printed and cached for use as well as a mapping object which adds some information to
 * query fields which will be passed through the resolver functions.
 *
 * For example, given a `Posts` section, it's possibe for the user to query
 * `getPostsDocument` - however when we receive that query it's not clear to us
 * that the resolver should only resolve documents for the `Posts` section, the
 * sectionMap helps with that:
 *
 * ```json
 *  {
 *    "getPostsDocument": {
 *      "section": {
 *        "slug": "posts"
 *        ...
 *      },
 *      "plural": false,
 *      "queryName": "getPostsDocument",
 *      "returnType": "Posts_Document"
 *    },
 *  }
 * ```
 */
export const schemaBuilder = async ({ cache }: { cache: Cache }) => {
  const sectionMap: sectionMap = {};
  const mutationsArray: mutationsArray = [];

  const sections = await cache.datasource.getSectionsSettings();
  const templates = await cache.datasource.getAllTemplates();

  sections.forEach((section) => {
    buildSectionMap(section, mutationsArray, sectionMap);
  });

  const accumulator: Definitions[] = [
    ...interfaceDefinitions,
    ...scalarDefinitions,
    systemInfoDefinition,
    sectionDefinition,
    mutationDefinition(mutationsArray),
    queryDefinition(sectionMap),
  ];

  await sequential(
    sections.filter((section) => section.type === "directory"),
    async (section) => {
      buildSectionDefinitions(section, accumulator);
    }
  );

  await sequential(templates, async (template) => {
    await buildTemplateOrField(cache, template, accumulator, true);
    await buildTemplateOrField(cache, template, accumulator, false);
  });

  const schema: DocumentNode = {
    kind: "Document",
    definitions: _.uniqBy(accumulator, (field) => field.name.value),
  };

  return { schema, sectionMap };
};

/**
 * Initial build is for documents, meaning an implicit _body
 * field may be included
 */
export const buildTemplateOrField = async (
  cache: Cache,
  template: TemplateData,
  accumulator: Definitions[],
  includeBody: boolean
) => {
  await buildTemplateOrFieldData(cache, template, accumulator, includeBody);
  await buildTemplateOrFieldValues(cache, template, accumulator, includeBody);
  await buildTemplateOrFieldForm(cache, template, accumulator, includeBody);
  await buildTemplateOrFieldInput(cache, template, accumulator, includeBody);
};
export const buildTemplateOrFieldData = async (
  cache: Cache,
  template: TemplateData,
  accumulator: Definitions[],
  includeBody: boolean
) => {
  const name = templateTypeName(template, "Data", includeBody);

  const fields = await sequential(template.fields, async (field) => {
    return await buildTemplateDataField(cache, field, accumulator);
  });

  if (includeBody) {
    fields.push(
      await buildTemplateDataField(cache, textarea.contentField, accumulator)
    );
  }

  accumulator.push(
    gql.object({
      name,
      fields,
    })
  );

  return name;
};
export const buildTemplateOrFieldValues = async (
  cache: Cache,
  template: TemplateData,
  accumulator: Definitions[],
  includeBody: boolean,
  includeTemplate: boolean = true
) => {
  const name = templateTypeName(template, "Values", includeBody);

  const fields = await sequential(template.fields, async (field) => {
    return buildTemplateInitialValueField(cache, field, accumulator);
  });

  if (includeBody) {
    fields.push(
      await buildTemplateInitialValueField(
        cache,
        textarea.contentField,
        accumulator
      )
    );
  }

  if (includeTemplate) {
    fields.push(gql.field({ name: "_template", type: "String" }));
  }

  accumulator.push(
    gql.object({
      name,
      fields,
    })
  );
  return name;
};

export const buildTemplateOrFieldFormFields = async (
  cache: Cache,
  template: TemplateData,
  accumulator: Definitions[],
  includeBody: boolean
) => {
  const name = templateTypeName(template, "Form", includeBody);

  const fields = await sequential(
    template.fields,
    async (field) => await buildTemplateFormField(cache, field, accumulator)
  );

  if (includeBody) {
    fields.push(
      await buildTemplateFormField(cache, textarea.contentField, accumulator)
    );
  }

  const fieldsUnionName = `${name}FieldsUnion`;
  accumulator.push(
    gql.union({
      name: fieldsUnionName,
      types: _.uniq(
        fields.map((field) => {
          switch (field.type.kind) {
            case "NamedType":
              return field.type.name.value;
            case "ListType":
            case "NonNullType":
              throw new Error(
                `Unexpected ${field.type.kind} for field union field`
              );
          }
        })
      ),
    })
  );

  return fieldsUnionName;
};

export const buildTemplateOrFieldInput = async (
  cache: Cache,
  template: TemplateData,
  accumulator: Definitions[],
  includeBody: boolean
) => {
  const name = templateTypeName(template, "Input", includeBody);

  const fields = await sequential(
    template.fields,
    async (field) =>
      await buildTemplateInputDataField(cache, field, accumulator)
  );

  if (includeBody) {
    fields.push(
      await buildTemplateInputDataField(
        cache,
        textarea.contentField,
        accumulator
      )
    );
  }

  accumulator.push(
    gql.input({
      name,
      fields,
    })
  );

  return name;
};

export const buildTemplateOrFieldForm = async (
  cache: Cache,
  template: TemplateData,
  accumulator: Definitions[],
  includeBody: boolean
) => {
  const name = templateTypeName(template, "Form", includeBody);

  const fieldsUnionName = await buildTemplateOrFieldFormFields(
    cache,
    template,
    accumulator,
    includeBody
  );

  accumulator.push(
    gql.object({
      name,
      fields: [
        gql.field({ name: "label", type: `String` }),
        gql.field({ name: "name", type: `String` }),
        gql.fieldList({ name: "fields", type: fieldsUnionName }),
      ],
    })
  );

  return name;
};

const buildTemplateFormField = async (
  cache: Cache,
  field: Field,
  accumulator: Definitions[]
): Promise<FieldDefinitionNode> => {
  switch (field.type) {
    case "text":
      return text.build.field({ cache, field, accumulator });
    case "textarea":
      return textarea.build.field({ cache, field, accumulator });
    case "select":
      return select.build.field({ cache, field, accumulator });
    case "blocks":
      return blocks.build.field({ cache, field, accumulator });
    case "field_group_list":
      return fieldGroupList.build.field({ cache, field, accumulator });
    case "field_group":
      return fieldGroup.build.field({ cache, field, accumulator });
    case "list":
      return list.build.field({ cache, field, accumulator });
    case "boolean":
      return boolean.build.field({ cache, field, accumulator });
    case "datetime":
      return datetime.build.field({ cache, field, accumulator });
    case "file":
      return file.build.field({ cache, field, accumulator });
    case "image_gallery":
      return imageGallery.build.field({ cache, field, accumulator });
    case "number":
      return number.build.field({ cache, field, accumulator });
    case "tag_list":
      return tag_list.build.field({ cache, field, accumulator });
    default:
      return text.build.field({ cache, field, accumulator });
  }
};

const buildTemplateInitialValueField = async (
  cache: Cache,
  field: Field,
  accumulator: Definitions[]
): Promise<FieldDefinitionNode> => {
  switch (field.type) {
    case "text":
      return text.build.initialValue({ cache, field, accumulator });
    case "textarea":
      return textarea.build.initialValue({ cache, field, accumulator });
    case "select":
      return await select.build.initialValue({ cache, field, accumulator });
    case "blocks":
      return blocks.build.initialValue({ cache, field, accumulator });
    case "field_group":
      return fieldGroup.build.initialValue({ cache, field, accumulator });
    case "field_group_list":
      return fieldGroupList.build.initialValue({ cache, field, accumulator });
    case "list":
      return list.build.initialValue({ cache, field, accumulator });
    case "boolean":
      return boolean.build.initialValue({ cache, field, accumulator });
    case "datetime":
      return datetime.build.initialValue({ cache, field, accumulator });
    case "file":
      return file.build.initialValue({ cache, field, accumulator });
    case "image_gallery":
      return imageGallery.build.initialValue({ cache, field, accumulator });
    case "number":
      return number.build.initialValue({ cache, field, accumulator });
    case "tag_list":
      return tag_list.build.initialValue({ cache, field, accumulator });
    default:
      return text.build.initialValue({ cache, field, accumulator });
  }
};

const buildTemplateDataField = async (
  cache: Cache,
  field: Field,
  accumulator: Definitions[]
): Promise<FieldDefinitionNode> => {
  switch (field.type) {
    case "text":
      return text.build.value({ cache, field, accumulator });
    case "textarea":
      return textarea.build.value({ cache, field, accumulator });
    case "select":
      return await select.build.value({ cache, field, accumulator });
    case "blocks":
      return blocks.build.value({ cache, field, accumulator });
    case "field_group":
      return await fieldGroup.build.value({ cache, field, accumulator });
    case "field_group_list":
      return fieldGroupList.build.value({ cache, field, accumulator });
    case "list":
      return list.build.value({ cache, field, accumulator });
    case "boolean":
      return boolean.build.value({ cache, field, accumulator });
    case "datetime":
      return datetime.build.value({ cache, field, accumulator });
    case "file":
      return file.build.value({ cache, field, accumulator });
    case "image_gallery":
      return imageGallery.build.value({ cache, field, accumulator });
    case "number":
      return number.build.value({ cache, field, accumulator });
    case "tag_list":
      return tag_list.build.value({ cache, field, accumulator });
    default:
      return text.build.value({ cache, field, accumulator });
  }
};

const buildTemplateInputDataField = async (
  cache: Cache,
  field: Field,
  accumulator: Definitions[]
): Promise<InputValueDefinitionNode> => {
  switch (field.type) {
    case "text":
      return text.build.input({ cache, field, accumulator });
    case "textarea":
      return textarea.build.input({ cache, field, accumulator });
    case "select":
      return select.build.input({ cache, field, accumulator });
    case "blocks":
      return await blocks.build.input({ cache, field, accumulator });
    case "field_group":
      return fieldGroup.build.input({ cache, field, accumulator });
    case "field_group_list":
      return fieldGroupList.build.input({ cache, field, accumulator });
    case "list":
      return list.build.input({ cache, field, accumulator });
    case "boolean":
      return boolean.build.input({ cache, field, accumulator });
    case "datetime":
      return datetime.build.input({ cache, field, accumulator });
    case "file":
      return file.build.input({ cache, field, accumulator });
    case "image_gallery":
      return imageGallery.build.input({ cache, field, accumulator });
    case "number":
      return number.build.input({ cache, field, accumulator });
    case "tag_list":
      return tag_list.build.input({ cache, field, accumulator });
    default:
      return text.build.input({ cache, field, accumulator });
  }
};

export const builders = {
  buildTemplateOrFieldFormFields,
  buildTemplateOrFieldData,
  buildTemplateOrFieldValues,
  buildTemplateOrFieldInput,
};

/**
 * Definitions for static interfaces which are identical
 * for any schema, ex. Node
 */
const interfaceDefinitions = [
  gql.interface({ name: "Node", fields: [gql.fieldID({ name: "id" })] }),
  gql.interface({
    name: "Document",
    fields: [
      gql.field({ name: "sys", type: "SystemInfo" }),
      gql.fieldID({ name: "id" }),
    ],
  }),
  gql.interface({
    name: "FormField",
    fields: [
      gql.field({ name: "label", type: "String" }),
      gql.field({ name: "name", type: "String" }),
      gql.field({ name: "component", type: "String" }),
    ],
  }),
];

/**
 * Definitions for additional scalars, ex. JSON
 */
const scalarDefinitions = [
  gql.scalar("Reference", "References another document, used as a foreign key"),
  gql.scalar("JSON"),
  gql.scalar("JSONObject"),
];

/**
 * System info provides information about a given document
 */
const systemInfoDefinition = gql.object({
  name: "SystemInfo",
  fields: [
    gql.field({ name: "filename", type: "String" }),
    gql.field({ name: "basename", type: "String" }),
    gql.fieldList({
      name: "breadcrumbs",
      type: "String",
      args: [gql.inputBoolean("excludeExtension")],
    }),
    gql.field({ name: "path", type: "String" }),
    gql.field({ name: "relativePath", type: "String" }),
    gql.field({ name: "extension", type: "String" }),
    gql.field({ name: "section", type: "Section" }),
  ],
});

const sectionDefinition = gql.object({
  name: "Section",
  fields: [
    gql.field({ name: "type", type: "String" }),
    gql.field({ name: "path", type: "String" }),
    gql.field({ name: "label", type: "String" }),
    gql.field({ name: "create", type: "String" }),
    gql.field({ name: "match", type: "String" }),
    gql.field({ name: "new_doc_ext", type: "String" }),
    gql.fieldList({ name: "templates", type: "String" }),
    gql.field({ name: "slug", type: "String" }),
    gql.fieldList({ name: "documents", type: "Document" }),
  ],
});

const buildSectionMap = (
  section: DirectorySection,
  mutationsArray: mutationsArray,
  sectionMap: sectionMap
) => {
  const returnType = friendlyName(section.slug, "Document");
  mutationsArray.push({
    section,
    mutationName: `update${friendlyName(section.slug)}Document`,
    returnType,
  });
  sectionMap[`update${friendlyName(section.slug)}Document`] = {
    section,
    plural: false,
    mutation: true,
    queryName: `update${friendlyName(section.slug)}Document`,
    returnType,
  };
  sectionMap[`get${friendlyName(section.slug)}Document`] = {
    section,
    plural: false,
    queryName: `get${friendlyName(section.slug)}Document`,
    returnType,
  };
  sectionMap[`get${friendlyName(section.slug)}List`] = {
    section,
    plural: true,
    queryName: `get${friendlyName(section.slug)}List`,
    returnType,
  };
};

/**
 * Given a list of mutation types, this will generate all possible
 * mutation definitions and argument definitions for a given schema. Ex. `Posts_Input`
 */
const mutationDefinition = (mutationsArray: mutationsArray) => {
  return gql.object({
    name: "Mutation",
    fields: [
      gql.field({
        name: "addPendingDocument",
        type: "Node",
        args: [
          gql.inputString("relativePath"),
          gql.inputString("section"),
          gql.inputString("template"),
        ],
      }),
      ...mutationsArray.map((mutation) => {
        return gql.field({
          name: mutation.mutationName,
          type: mutation.returnType,
          args: [
            gql.inputString("relativePath"),
            gql.inputValue(
              "params",
              friendlyName(mutation.section.slug, "Input")
            ),
          ],
        });
      }),
    ],
  });
};

const queryDefinition = (sectionMap: sectionMap) => {
  return gql.object({
    name: "Query",
    fields: [
      gql.field({
        name: "node",
        type: "Node",
        args: [gql.inputID("id")],
      }),
      gql.fieldList({
        name: "getSections",
        type: "Section",
      }),
      gql.field({
        name: "getSection",
        type: "Section",
        args: [gql.inputString("section")],
      }),
      ...Object.values(sectionMap)
        .filter((section) => !section.mutation)
        .map((section) => {
          return section.plural
            ? gql.fieldList({
                name: section.queryName,
                type: section.returnType,
                args: [],
              })
            : gql.field({
                name: section.queryName,
                type: section.returnType,
                args: [gql.inputString("relativePath")],
              });
        }),
    ],
  });
};

const buildSectionDefinitions = (
  section: DirectorySection,
  accumulator: Definitions[]
) => {
  const name = friendlyName(section.slug);
  accumulator.push(
    gql.union({
      name: friendlyName(name, "Data"),
      types: section.templates.map((template) =>
        templateTypeName(template, "Data", true)
      ),
    })
  );
  accumulator.push(
    gql.input({
      name: friendlyName(name, "Input"),
      fields: section.templates.map((template) =>
        gql.inputValue(
          friendlyName(template, "", true),
          templateTypeName(template, "Input", true)
        )
      ),
    })
  );
  accumulator.push(
    gql.union({
      name: friendlyName(name, "Values"),
      types: section.templates.map((template) =>
        templateTypeName(template, "Values", true)
      ),
    })
  );
  accumulator.push(
    gql.union({
      name: friendlyName(name, "Form"),
      types: section.templates.map((template) =>
        templateTypeName(template, "Form", true)
      ),
    })
  );
  accumulator.push(
    gql.object({
      name: friendlyName(name, "Document"),
      interfaces: [
        {
          kind: "NamedType",
          name: {
            kind: "Name",
            value: "Node",
          },
        },
        {
          kind: "NamedType",
          name: {
            kind: "Name",
            value: "Document",
          },
        },
      ],
      fields: [
        gql.fieldID({ name: "id" }),
        gql.field({ name: "sys", type: "SystemInfo" }),
        gql.field({
          name: "data",
          type: friendlyName(name, "Data"),
        }),
        gql.field({
          name: "values",
          type: friendlyName(name, "Values"),
        }),
        gql.field({
          name: "form",
          type: friendlyName(name, "Form"),
        }),
      ],
    })
  );
};

export type Definitions =
  | ObjectTypeDefinitionNode
  | UnionTypeDefinitionNode
  | InputObjectTypeDefinitionNode
  | ScalarTypeDefinitionNode
  | InterfaceTypeDefinitionNode
  | EnumTypeDefinitionNode;

type sectionMap = {
  [key: string]: {
    section: DirectorySection;
    plural: boolean;
    mutation?: boolean;
    queryName: string;
    returnType: string;
  };
};
type mutationsArray = {
  section: Section;
  mutationName: string;
  returnType: string;
}[];
