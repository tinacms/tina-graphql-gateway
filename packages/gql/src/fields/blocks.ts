import type { DataSource } from "../datasources/datasource";
import type { TemplateData } from "../types";
import { GraphQLString, GraphQLObjectType, GraphQLList } from "graphql";
import type { resolveTemplateType, resolveDataType } from "../graphql";
import type { Cache } from "../schema-builder";
import type { BlocksFieldDefinititon } from "@tinacms/fields";

export type BlocksField = {
  label: string;
  name: string;
  type: "blocks";
  default: string;
  template_types: string[];
  config?: {
    required?: boolean;
  };
  templates: { [key: string]: TemplateData };
};
type TinaBlocksField = BlocksFieldDefinititon & {
  template_types: string[];
  __typename: "BlocksFormField";
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
      new GraphQLObjectType<BlocksField>({
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
      type: GraphQLList(
        await cache.builder.buildDataUnion({
          cache,
          templates: field.template_types,
        })
      ),
    };
  },
};

const resolvers = {
  formFieldBuilder: async (
    datasource: DataSource,
    field: BlocksField,
    resolveTemplate: resolveTemplateType
  ): Promise<TinaBlocksField> => {
    const templates: { [key: string]: TemplateData } = {};
    await Promise.all(
      field.template_types.map(async (templateSlug) => {
        const template = await datasource.getTemplate({
          slug: templateSlug,
        });
        templates[`${templateSlug}TemplateFields`] = await resolveTemplate(
          datasource,
          template
        );
      })
    );

    const { ...rest } = field;
    return {
      ...rest,
      component: "blocks" as const,
      templates,
      __typename: "BlocksFormField" as const,
    };
  },

  dataFieldBuilder: async (
    datasource: DataSource,
    field: BlocksField,
    value: any,
    resolveData: resolveDataType
  ) => {
    return await Promise.all(
      value.map(async (item: any) => {
        const t = field.templates[`${item.template}TemplateFields`];
        const { template, ...rest } = item;
        return await resolveData(datasource, t, rest);
      })
    );
  },
};

export const blocks = {
  resolvers,
  builders,
};
