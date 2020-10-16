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
  EnumTypeDefinitionNode,
  InputValueDefinitionNode,
} from "graphql";
import _, { template } from "lodash";
import { gql } from "../gql";

import { Cache } from "../cache";
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

export type Definitions =
  | ObjectTypeDefinitionNode
  | UnionTypeDefinitionNode
  | InputObjectTypeDefinitionNode
  | EnumTypeDefinitionNode;

/**
 * @internal this is redundant in documentation
 */
export const builder = {
  schema: async ({ cache }: { cache: Cache }) => {
    const accumulator: Definitions[] = [
      gql.object({
        name: "Query",
        fields: [
          gql.field({
            name: "document",
            value: "DocumentUnion",
            args: [gql.inputString("path")],
          }),
        ],
      }),
      gql.object({
        name: "Mutation",
        fields: [
          gql.field({
            name: "updateDocument",
            value: "DocumentUnion",
            args: [
              gql.inputString("path"),
              gql.input("params", "DocumentInput"),
            ],
          }),
        ],
      }),
    ];

    await builder.documentTaggedUnionInputObject({
      cache,
      accumulator,
    });
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
    build = true,
  }: {
    cache: Cache;
    section?: string;
    accumulator: Definitions[];
    build?: boolean;
  }) => {
    const name = friendlyName(section, "DocumentUnion");

    const templates = await cache.datasource.getTemplatesForSection(section);
    const templateNames = await sequential(
      templates,
      async (template: TemplateData) => {
        return await builder.documentObject(
          cache,
          template,
          accumulator,
          build
        );
      }
    );
    accumulator.push(gql.union({ name: name, types: templateNames }));

    return name;
  },
  documentTaggedUnionInputObject: async ({
    cache,
    section,
    accumulator,
  }: {
    cache: Cache;
    section?: string;
    accumulator: Definitions[];
  }) => {
    const name = friendlyName(section, "DocumentInput");

    const templates = await sequential(
      await cache.datasource.getTemplatesForSection(section),
      async (template) => {
        return await builder.documentInputObject(cache, template, accumulator);
      }
    );

    accumulator.push(
      gql.inputObject({
        name,
        fields: templates.map((templateName) =>
          gql.input(templateName, templateName)
        ),
      })
    );
    return name;
  },
  documentDataTaggedUnionInputObject: async ({
    cache,
    templateSlugs,
    accumulator,
  }: {
    cache: Cache;
    templateSlugs: string[];
    accumulator: Definitions[];
  }) => {
    const name = friendlyName(templateSlugs.join("_"), "DocumentInput");

    const templateData = await sequential(
      templateSlugs,
      async (templateSlug) => await cache.datasource.getTemplate(templateSlug)
    );
    const templates = await sequential(await templateData, async (template) => {
      return await builder.documentDataInputObject(
        cache,
        template,
        true,
        accumulator,
        true
      );
    });

    accumulator.push(
      gql.inputObject({
        name,
        fields: templates.map((templateName) =>
          gql.input(templateName, templateName)
        ),
      })
    );
    return name;
  },
  documentInputObject: async (
    cache: Cache,
    template: TemplateData,
    accumulator: Definitions[]
  ) => {
    const name = friendlyName(template, "Input");

    const dataInputName = await builder.documentDataInputObject(
      cache,
      template,
      false,
      accumulator
    );

    accumulator.push(
      gql.inputObject({
        name,
        fields: [
          gql.input("data", dataInputName),
          gql.input("content", "String"),
        ],
      })
    );

    return name;
  },
  documentDataInputObject: async (
    cache: Cache,
    template: TemplateData,
    returnTemplate: boolean,
    accumulator: Definitions[],
    build: boolean = true
  ) => {
    const name = friendlyName(template, "InputData");

    if (build) {
      const fieldNames = await sequential(template.fields, async (field) => {
        // TODO: this is where non-null criteria can be set
        return await buildTemplateInputDataField(cache, field, accumulator);
      });

      if (returnTemplate) {
        fieldNames.unshift(gql.inputString("template"));
      }

      if (build) {
        accumulator.push(gql.inputObject({ name, fields: fieldNames }));
      }
    }

    return name;
  },
  documentObject: async (
    cache: Cache,
    template: TemplateData,
    accumulator: Definitions[],
    build: boolean
  ) => {
    const name = friendlyName(template);
    if (build) {
      const formName = await builder.documentFormObject(
        cache,
        template,
        accumulator
      );
      const dataName = await builder.documentDataObject(
        cache,
        template,
        false,
        accumulator,
        true
      );
      const initialValuesName = await builder.documentInitialValuesObject(
        cache,
        template,
        false,
        accumulator
      );

      accumulator.push(
        gql.object({
          name,
          fields: [
            gql.field({ name: "path", value: "String" }),
            gql.field({ name: "form", value: formName }),
            gql.field({ name: "data", value: dataName }),
            gql.field({ name: "initialValues", value: initialValuesName }),
          ],
        })
      );
    }

    return name;
  },
  documentDataObject: async (
    cache: Cache,
    template: TemplateData,
    returnTemplate: boolean,
    accumulator: Definitions[],
    includeContent: boolean = false
  ) => {
    const name = friendlyName(template, "Data");
    const fields = await sequential(template.fields, async (field) => {
      return await buildTemplateDataField(cache, field, accumulator);
    });

    if (includeContent) {
      fields.push(
        textarea.build.value({
          cache,
          field: textarea.contentField,
          accumulator,
        })
      );
    }

    accumulator.push(gql.object({ name, fields }));

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

    accumulator.push(
      gql.object({
        name,
        fields: [
          gql.field({ name: "label", value: "String" }),
          gql.field({ name: "name", value: "String" }),
          gql.listField({ name: "fields", value: fieldUnionName }),
        ],
      })
    );

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

    accumulator.push(gql.union({ name, types: fieldNames }));

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

    if (returnTemplate) {
      fieldNames.unshift(gql.string("_template"));
    }

    accumulator.push(gql.object({ name, fields: fieldNames }));

    return name;
  },
  initialValuesUnion: async ({
    cache,
    templates,
    returnTemplate,
    accumulator,
  }: {
    cache: Cache;
    templates: string[];
    returnTemplate: boolean;
    accumulator: Definitions[];
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
    accumulator.push(gql.union({ name, types }));

    return name;
  },
  documentDataUnion: async ({
    cache,
    templates,
    returnTemplate,
    accumulator,
  }: {
    cache: Cache;
    templates: string[];
    returnTemplate: boolean;
    accumulator: Definitions[];
  }) => {
    const name = friendlyName(templates, "DataUnion");
    const templateObjects = await cache.datasource.getTemplates(templates);
    const types = await sequential(
      templateObjects,
      async (template) =>
        await builder.documentDataObject(
          cache,
          template,
          returnTemplate,
          accumulator
        )
    );

    accumulator.push(gql.union({ name, types }));

    return name;
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
      return text.build.initialValue({ cache, field, accumulator });
    case "textarea":
      return textarea.build.initialValue({ cache, field, accumulator });
    case "select":
      return select.build.initialValue({ cache, field, accumulator });
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
      return select.build.value({ cache, field, accumulator });
    case "blocks":
      return blocks.build.value({ cache, field, accumulator });
    case "field_group":
      return fieldGroup.build.value({ cache, field, accumulator });
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
  }
};
