import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLUnionType,
  GraphQLList,
  getNamedType,
  GraphQLType,
  GraphQLInputObjectType,
  GraphQLInputFieldConfigMap,
  InputObjectTypeDefinitionNode,
  FieldDefinitionNode,
} from "graphql";
import _ from "lodash";
import { gql } from "../gql";

import { Cache } from "../cache";
import { text } from "../fields/text";
import { list } from "../fields/list";
import { select } from "../fields/select";
import { blocks } from "../fields/blocks";
import { textarea } from "../fields/textarea";
import { fieldGroup } from "../fields/field-group";
import { fieldGroupList } from "../fields/field-group-list";
import { friendlyName } from "@forestryio/graphql-helpers";
import { sequential } from "../util";

import type {
  DocumentNode,
  GraphQLFieldConfigMap,
  UnionTypeDefinitionNode,
  ObjectTypeDefinitionNode,
} from "graphql";
import type { TemplateData } from "../types";
import type { Field } from "../fields";
import type { ContextT } from "../resolver";
import { gql } from "../fields/test-util";

export type Definitions =
  | ObjectTypeDefinitionNode
  | UnionTypeDefinitionNode
  | InputObjectTypeDefinitionNode;

/**
 * @internal this is redundant in documentation
 */
export const builder = {
  schema: async ({ cache }: { cache: Cache }) => {
    const accumulator: Definitions[] = [
      {
        kind: "ObjectTypeDefinition",
        name: {
          kind: "Name",
          value: "Query",
        },
        fields: [
          {
            kind: "FieldDefinition",
            name: {
              kind: "Name",
              value: "document",
            },
            type: {
              kind: "NamedType",
              name: {
                kind: "Name",
                value: "DocumentUnion",
              },
            },
            arguments: [
              {
                kind: "InputValueDefinition",
                name: {
                  kind: "Name",
                  value: "path",
                },
                type: {
                  kind: "NamedType",
                  name: {
                    kind: "Name",
                    value: "String",
                  },
                },
              },
            ],
          },
        ],
      },
    ];

    await builder.documentUnion({ cache, accumulator });

    const schema: DocumentNode = {
      kind: "Document",
      // TODO: we can probably optimize this by not running calculations for fields
      // whose names we already have, not worth it for the first pass though.
      definitions: _.uniqBy(accumulator, (field) => field.name.value),
    };

    return schema;
  },
  documentUnion: async ({
    cache,
    section,
    accumulator,
  }: {
    cache: Cache;
    section?: string;
    accumulator: Definitions[];
  }) => {
    const name = friendlyName(section, "DocumentUnion");

    const templates = await cache.datasource.getTemplatesForSection(section);
    const templateNames = await sequential(
      templates,
      async (template: TemplateData) => {
        return await builder.documentObject(cache, template, accumulator);
      }
    );

    accumulator.push({
      kind: "UnionTypeDefinition",
      name: {
        kind: "Name",
        value: name,
      },
      directives: [],
      types: templateNames.map((name) => ({
        kind: "NamedType",
        name: {
          kind: "Name",
          value: name,
        },
      })),
    });
  },
  documentObject: async (
    cache: Cache,
    template: TemplateData,
    accumulator: Definitions[]
  ) => {
    const name = friendlyName(template);
    const formName = await builder.documentFormObject(
      cache,
      template,
      accumulator
    );
    const dataName = await builder.documentDataObject(
      cache,
      template,
      false,
      accumulator
    );
    const initialValuesName = await builder.documentInitialValuesObject(
      cache,
      template,
      false,
      accumulator
    );

    accumulator.push({
      kind: "ObjectTypeDefinition",
      name: {
        kind: "Name",
        value: name,
      },
      interfaces: [],
      directives: [],
      fields: [
        {
          kind: "FieldDefinition",
          name: {
            kind: "Name",
            value: "path",
          },
          arguments: [],
          type: {
            kind: "NamedType",
            name: {
              kind: "Name",
              value: "String",
            },
          },
          directives: [],
        },
        {
          kind: "FieldDefinition",
          name: {
            kind: "Name",
            value: "form",
          },
          arguments: [],
          type: {
            kind: "NamedType",
            name: {
              kind: "Name",
              value: formName,
            },
          },
          directives: [],
        },
        {
          kind: "FieldDefinition",
          name: {
            kind: "Name",
            value: "data",
          },
          arguments: [],
          type: {
            kind: "NamedType",
            name: {
              kind: "Name",
              value: dataName,
            },
          },
          directives: [],
        },
        {
          kind: "FieldDefinition",
          name: {
            kind: "Name",
            value: "initialValues",
          },
          arguments: [],
          type: {
            kind: "NamedType",
            name: {
              kind: "Name",
              value: initialValuesName,
            },
          },
          directives: [],
        },
      ],
    });

    return name;
  },
  documentDataObject: async (
    cache: Cache,
    template: TemplateData,
    returnTemplate: boolean,
    accumulator: Definitions[]
  ) => {
    const name = friendlyName(template, "Data");
    const fields = await sequential(template.fields, async (field) => {
      return await buildTemplateDataField(cache, field);
    });
    accumulator.push({
      kind: "ObjectTypeDefinition",
      name: {
        kind: "Name",
        value: name,
      },
      interfaces: [],
      directives: [],
      fields,
      // fields: [
      //   {
      //     kind: "FieldDefinition",
      //     name: {
      //       kind: "Name",
      //       value: "title",
      //     },
      //     arguments: [],
      //     type: {
      //       kind: "NamedType",
      //       name: {
      //         kind: "Name",
      //         value: "String",
      //       },
      //     },
      //     directives: [],
      //   },
      //   // {
      //   //   kind: "FieldDefinition",
      //   //   name: {
      //   //     kind: "Name",
      //   //     value: "author",
      //   //   },
      //   //   arguments: [],
      //   //   type: {
      //   //     kind: "NamedType",
      //   //     name: {
      //   //       kind: "Name",
      //   //       value: "Post_Author_Document",
      //   //     },
      //   //   },
      //   //   directives: [],
      //   // },
      // ],
    });

    return name;
  },
  documentFormObject: async (
    cache: Cache,
    template: TemplateData,
    accumulator: Definitions[]
  ) => {
    const name = friendlyName(template, "Form");

    const fieldUnionName = await builder.documentFormFieldsUnion(
      cache,
      template,
      accumulator
    );

    accumulator.push({
      kind: "ObjectTypeDefinition",
      name: {
        kind: "Name",
        value: name,
      },
      interfaces: [],
      directives: [],
      fields: [
        {
          kind: "FieldDefinition",
          name: {
            kind: "Name",
            value: "label",
          },
          arguments: [],
          type: {
            kind: "NamedType",
            name: {
              kind: "Name",
              value: "String",
            },
          },
          directives: [],
        },
        {
          kind: "FieldDefinition",
          name: {
            kind: "Name",
            value: "name",
          },
          arguments: [],
          type: {
            kind: "NamedType",
            name: {
              kind: "Name",
              value: "String",
            },
          },
          directives: [],
        },
        {
          kind: "FieldDefinition",
          name: {
            kind: "Name",
            value: "fields",
          },
          arguments: [],
          type: {
            kind: "ListType",
            type: {
              kind: "NamedType",
              name: {
                kind: "Name",
                value: fieldUnionName,
              },
            },
          },
          directives: [],
        },
      ],
    });
    return name;
  },
  documentFormFieldsUnion: async (
    cache: Cache,
    template: TemplateData,
    accumulator: Definitions[]
  ): Promise<string> => {
    const name = friendlyName(template, "FormFields");
    const fields = _.uniqBy(template.fields, (field) => field.type);
    const fieldNames = await buildTemplateFormFields(
      cache,
      fields,
      accumulator
    );

    accumulator.push({
      kind: "UnionTypeDefinition",
      name: {
        kind: "Name",
        value: name,
      },
      directives: [],
      types: fieldNames.map((fieldName) => {
        return {
          kind: "NamedType",
          name: {
            kind: "Name",
            value: fieldName,
          },
        };
      }),
    });

    return name;
  },
  documentInitialValuesObject: async (
    cache: Cache,
    template: TemplateData,
    returnTemplate: boolean,
    accumulator: Definitions[]
  ) => {
    const name = friendlyName(template, "InitialValues");

    const fieldNames = await sequential(template.fields, async (field) => {
      return await buildTemplateInitialValueField(cache, field, accumulator);
    });

    let additionalFields = [];
    if (returnTemplate) {
      additionalFields.push(gql.string("template"));
    }

    accumulator.push({
      kind: "ObjectTypeDefinition",
      name: {
        kind: "Name",
        value: name,
      },
      fields: [...additionalFields, ...fieldNames],
    });

    return name;
  },
  initialValuesUnion: async ({
    cache,
    templates,
    returnTemplate,
    accumulator,
  }) => {
    const name = friendlyName(templates, "InitialValuesUnion");
    const templateObjects = await cache.datasource.getTemplates(templates);
    const types = await sequential(
      templateObjects,
      async (template) =>
        await builder.documentInitialValuesObject(
          cache,
          template,
          returnTemplate,
          accumulator
        )
    );
    return types;
  },
  buildTemplateFormFields: async (
    cache: Cache,
    fields: Field[],
    accumulator: Definitions[]
  ): Promise<string[]> => {
    return await sequential(fields, async (field) => {
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
      }
    });
  },
};

const buildTemplateFormFields = async (
  cache: Cache,
  fields: Field[],
  accumulator: Definitions[]
): Promise<string[]> => {
  return await sequential(fields, async (field) => {
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
    }
  });
};

const buildTemplateInitialValueField = async (
  cache: Cache,
  field: Field,
  accumulator: Definitions[]
): Promise<FieldDefinitionNode> => {
  switch (field.type) {
    case "text":
      return text.build.initialValue({ cache, field });
    case "textarea":
      return textarea.build.initialValue({ cache, field });
    case "select":
      return select.build.initialValue({ cache, field });
    case "blocks":
      return blocks.build.initialValue({ cache, field, accumulator });
    case "field_group":
      return fieldGroup.build.initialValue({ cache, field });
    case "field_group_list":
      return fieldGroupList.build.initialValue({ cache, field });
    case "list":
      return list.build.initialValue({ cache, field });
  }
};

const buildTemplateDataField = async (
  cache: Cache,
  field: Field
): Promise<FieldDefinitionNode> => {
  switch (field.type) {
    case "text":
      return text.build.value({ cache, field });
    case "textarea":
      return textarea.build.value({ cache, field });
    case "select":
      return select.build.value({ cache, field });
    case "blocks":
      return blocks.build.value({ cache, field });
    case "field_group":
      return fieldGroup.build.value({ cache, field });
    case "field_group_list":
      return fieldGroupList.build.value({ cache, field });
    case "list":
      return list.build.value({ cache, field });
  }
};
