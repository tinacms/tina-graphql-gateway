import type { DataSource } from "../../datasources/datasource";
import { friendlyName } from "../../util";
import type { TinaTemplateData } from "../../types";
import { GraphQLString, GraphQLObjectType, GraphQLList } from "graphql";
import * as yup from "yup";
import type {
  resolveTemplateType,
  resolveDataType,
  ResolvedData,
} from "../../graphql";
import type { Cache } from "../../schema-builder";

export type BlocksField = {
  label: string;
  name: string;
  type: "blocks";
  default?: string;
  template_types: string[];
  config?: {
    required?: boolean;
  };
};
export type TinaBlocksField = {
  label: string;
  name: string;
  type: "blocks";
  default?: string;
  component: "blocks";
  config?: {
    required?: boolean;
  };
  templates: { [key: string]: TinaTemplateData };
  __typename: string;
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

    const name = `Blocks${field.template_types
      .map((name) => friendlyName(name))
      .join("")}`;

    return cache.build(
      new GraphQLObjectType<BlocksField>({
        name: typename(field),
        fields: {
          name: { type: GraphQLString },
          label: { type: GraphQLString },
          component: { type: GraphQLString },
          templates: {
            type: cache.build(
              new GraphQLObjectType({
                name: `${typename(field)}Templates`,
                fields: templateForms,
              })
            ),
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
      __typename: typename(field),
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
  const schema = yup.array().of(
    yup.object({
      template: yup.string().required(),
    })
  );
  schema.validateSync(value);
}

const typename = (field: BlocksField) => {
  const name = `Blocks${field.template_types
    .map((name) => friendlyName(name))
    .join("")}`;
  return name;
};

export const blocks = {
  resolve,
  build,
};
