import type { DataSource } from "../datasources/datasource";
import type { TinaTemplateData } from "../types";
import { GraphQLString, GraphQLObjectType, GraphQLList } from "graphql";
import Joi from "joi";
import type {
  resolveTemplateType,
  resolveDataType,
  ResolvedData,
} from "../graphql";
import type { Cache } from "../schema-builder";
// import type { BlocksFieldDefinititon } from "@tinacms/fields";

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
export type TinaBlocksField = {
  label: string;
  name: string;
  type: "blocks";
  default: string;
  template_types: string[];
  component: "blocks";
  config?: {
    required?: boolean;
  };
  templates: { [key: string]: TinaTemplateData };
  __typename: "BlocksFormField";
};

type BlockValue = {
  template: string;
  [key: string]: unknown;
};

const build = {
  field: async ({ cache, field }: { cache: Cache; field: BlocksField }) => {
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
  value: async ({ cache, field }: { cache: Cache; field: BlocksField }) => {
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

const resolve = {
  /**
   * Resolves the values with their respective templates, specified by
   * the template key.
   *
   * ```js
   * // given
   * {
   *   name: 'sections',
   *   type: 'blocks',
   *   label: 'Sections',
   *   template_types: [ 'section' ]
   * }
   *
   * // expect
   * {
   *   name: 'sections',
   *   type: 'blocks',
   *   label: 'Sections',
   *   template_types: [ 'section' ],
   *   component: 'blocks',
   *   templates: {
   *     sectionTemplateFields: {
   *       __typename: 'Section',
   *       label: 'Section',
   *       hide_body: false,
   *       fields: [Array]
   *     }
   *   },
   *   __typename: 'BlocksFormField'
   * }
   *
   * ```
   */
  field: async ({
    datasource,
    field,
    resolveTemplate,
  }: {
    datasource: DataSource;
    field: BlocksField;
    resolveTemplate: resolveTemplateType;
  }): Promise<TinaBlocksField> => {
    const templates: { [key: string]: TinaTemplateData } = {};
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

    return {
      ...field,
      component: "blocks" as const,
      templates,
      __typename: "BlocksFormField" as const,
    };
  },

  value: async ({
    datasource,
    field,
    value,
    resolveData,
    resolveTemplate,
  }: {
    datasource: DataSource;
    field: BlocksField;
    value: unknown;
    resolveData: resolveDataType;
    resolveTemplate: resolveTemplateType;
  }): Promise<ResolvedData[]> => {
    assertIsBlock(value);

    return await Promise.all(
      value.map(async (item) => {
        const { template, ...rest } = item;
        const templateData = await datasource.getTemplate({ slug: template });
        return await resolveData(datasource, templateData, rest);
      })
    );
  },
};

function assertIsBlock(value: unknown): asserts value is BlockValue[] {
  const schema = Joi.array().items(
    Joi.object({
      template: Joi.string(),
    }).unknown()
  );
  const { error } = schema.validate(value);
  if (error) {
    throw new Error(error.message);
  }
}

export const blocks = {
  resolve,
  build,
};
