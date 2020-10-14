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

    accumulator.push({
      kind: "InputObjectTypeDefinition",
      name: {
        kind: "Name",
        value: name,
      },
      fields: templates.map((templateName) => ({
        kind: "InputValueDefinition",
        name: {
          kind: "Name",
          value: templateName,
        },
        type: {
          kind: "NamedType",
          name: {
            kind: "Name",
            value: templateName,
          },
        },
      })),
    });
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

    accumulator.push({
      kind: "InputObjectTypeDefinition",
      name: {
        kind: "Name",
        value: name,
      },
      fields: templates.map((templateName) => ({
        kind: "InputValueDefinition",
        name: {
          kind: "Name",
          value: templateName,
        },
        type: {
          kind: "NamedType",
          name: {
            kind: "Name",
            value: templateName,
          },
        },
      })),
    });
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

    accumulator.push({
      kind: "InputObjectTypeDefinition",
      name: {
        kind: "Name",
        value: name,
      },
      fields: [
        {
          kind: "InputValueDefinition",
          name: {
            kind: "Name",
            value: "data",
          },
          type: {
            kind: "NamedType",
            name: {
              kind: "Name",
              value: dataInputName,
            },
          },
        },
        {
          kind: "InputValueDefinition",
          name: {
            kind: "Name",
            value: "content",
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
    });

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

      let additionalFields: InputValueDefinitionNode[] = [];
      if (returnTemplate) {
        additionalFields.push(gql.inputString("template"));
      }

      if (build)
        accumulator.push({
          kind: "InputObjectTypeDefinition",
          name: {
            kind: "Name",
            value: name,
          },
          fields: [...additionalFields, ...fieldNames],
        });
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
    }

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
      return await buildTemplateDataField(cache, field, accumulator);
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
      additionalFields.push(gql.string("_template"));
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
    accumulator.push({
      kind: "UnionTypeDefinition",
      name: {
        kind: "Name",
        value: name,
      },
      directives: [],
      types: types.map((fieldName) => {
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
    accumulator.push({
      kind: "UnionTypeDefinition",
      name: {
        kind: "Name",
        value: name,
      },
      directives: [],
      types: types.map((fieldName) => {
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
      default:
        return text.build.field({ cache, field, accumulator });
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
      return select.build.value({ cache, field, accumulator });
    case "blocks":
      return blocks.build.value({ cache, field, accumulator });
    case "field_group":
      return fieldGroup.build.value({ cache, field, accumulator });
    case "field_group_list":
      return fieldGroupList.build.value({ cache, field, accumulator });
    case "list":
      return list.build.value({ cache, field, accumulator });
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
    default:
      return text.build.input({ cache, field, accumulator });
  }
};
