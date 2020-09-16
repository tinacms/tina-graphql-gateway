import type { Field } from "./index";
import type { DataSource } from "../datasources/datasource";
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLUnionType,
  GraphQLNonNull,
  FieldsOnCorrectTypeRule,
} from "graphql";
import type { Cache } from "../schema-builder";

export type BlocksField = {
  label: string;
  name: string;
  type: "blocks";
  default: string;
  template_types: string[];
  config?: {
    required?: boolean;
  };
};

type FieldMap = { [key: string]: Field };
const getter = async ({
  value,
  field,
  datasource,
}: {
  value: { template: string; [key: string]: unknown }[];
  field: BlocksField;
  datasource: DataSource;
}): Promise<{ _fields: FieldMap; [key: string]: unknown }[]> => {
  return Promise.all(
    value.map(async (value) => {
      const template = await datasource.getTemplate({ slug: value.template });
      const fields: { [key: string]: Field } = {};
      template.fields.forEach((field) => (fields[field.name] = field));

      return {
        _fields: fields,
        ...value,
      };
    })
  );
};

const builders = {
  formFieldBuilder: async ({
    cache,
    field,
  }: {
    cache: Cache;
    field: BlocksField;
  }) => {
    const templateForms: { [key: string]: any } = {};
    await Promise.all(
      field.template_types.map(async (templateSlug) => {
        const template = await cache.datasource.getTemplate({
          slug: templateSlug,
        });
        templateForms[`${templateSlug}TemplateFields`] = {
          type: await cache.builder.buildTemplateForm(cache, template),
        };
      })
    );

    return cache.build(
      new GraphQLObjectType({
        name: "BlocksFormField",
        fields: {
          name: { type: GraphQLString },
          label: { type: GraphQLString },
          component: { type: GraphQLString },
          templates: {
            type: new GraphQLObjectType({
              name: "BlocksTemplates",
              fields: templateForms,
            }),
          },
        },
      })
    );
  },
  dataFieldBuilder: async ({
    cache,
    field,
  }: {
    cache: Cache;
    field: BlocksField;
  }) => {
    return {
      type: await cache.builder.buildDataUnion({
        cache,
        templates: field.template_types,
      }),
    };
  },
};

export const blocks = {
  getter,
  builders,
};
