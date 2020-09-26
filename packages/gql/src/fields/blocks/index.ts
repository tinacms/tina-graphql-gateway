import type { DataSource } from "../../datasources/datasource";
import { friendlyName } from "../../util";
import _ from "lodash";
import type { TinaTemplateData } from "../../types";
import {
  GraphQLString,
  GraphQLInputObjectType,
  getNamedType,
  GraphQLObjectType,
  GraphQLList,
} from "graphql";
import * as yup from "yup";
import type {
  resolveTemplateType,
  resolveDataType,
  resolveInitialValuesType,
  ResolvedData,
} from "../../resolver";
import type { Cache } from "../../builder";

export type BlocksField = {
  label: string;
  name: string;
  type: "blocks";
  default?: string;
  template_types: string[];
  __namespace: string;
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

    return cache.build(
      new GraphQLObjectType<BlocksField>({
        name: `${field.__namespace}${field.label}BlocksField`,
        fields: {
          name: { type: GraphQLString },
          label: { type: GraphQLString },
          component: { type: GraphQLString },
          templates: {
            type: cache.build(
              new GraphQLObjectType({
                name: `${field.__namespace}${field.label}BlocksFieldTemplates`,
                fields: templateForms,
              })
            ),
          },
        },
      })
    );
  },
  initialValue: async ({
    cache,
    field,
  }: {
    cache: Cache;
    field: BlocksField;
  }) => {
    return {
      type: GraphQLList(
        await cache.builder.buildInitialValuesUnion({
          cache,
          templates: field.template_types,
        })
      ),
    };
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
  input: async ({ cache, field }: { cache: Cache; field: BlocksField }) => {
    const templates = await Promise.all(
      field.template_types.map((tt) =>
        cache.datasource.getTemplate({ slug: tt })
      )
    );

    const templateTypes = await Promise.all(
      templates.map((template) => {
        return cache.builder.buildTemplateInputData(cache, template);
      })
    );

    const accum: { [key: string]: { type: GraphQLInputObjectType } } = {};
    templateTypes.forEach((template) => {
      accum[getNamedType(template).toString()] = { type: template };
    });
    return {
      type: cache.build(
        GraphQLList(
          new GraphQLInputObjectType({
            name: `${field.__namespace}${field.label}BlocksInput`,
            fields: accum,
          })
        )
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
      __typename: `${field.__namespace}${field.label}BlocksField`,
    };
  },

  initialValue: async ({
    datasource,
    field,
    value,
    resolveInitialValues,
    resolveTemplate,
  }: {
    datasource: DataSource;
    field: BlocksField;
    value: unknown;
    resolveInitialValues: resolveInitialValuesType;
    resolveTemplate: resolveTemplateType;
  }): Promise<ResolvedData[]> => {
    assertIsBlock(value);
    return await Promise.all(
      value.map(async (item) => {
        const { template, ...rest } = item;
        const templateData = await datasource.getTemplate({ slug: template });
        return {
          _template: `${template}TemplateFields`,
          ...(await resolveInitialValues(datasource, templateData, rest)),
        };
      })
    );
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
  input: async ({
    datasource,
    field,
    value,
    resolveData,
    resolveTemplate,
    resolveDocumentInputData,
  }: {
    datasource: DataSource;
    field: BlocksField;
    value: unknown;
    resolveData: resolveDataType;
    resolveTemplate: resolveTemplateType;
    resolveDocumentInputData: any;
  }): Promise<ResolvedData[]> => {
    // FIXME: we should validate that only one key was passed
    assertIsArray(value);

    return await Promise.all(
      value.map(async (item) => {
        assertIsBlockInput(item);
        const data = Object.values(item)[0];
        const template = await datasource.getTemplate({
          // FIXME: we're sending the label in here as if it's a template slug
          // we want to send the slug in instead so we don't have to lowercase it
          slug: _.lowerCase(data._template),
        });
        return await resolveDocumentInputData({ data, template, datasource });
      })
    );
  },
};

function assertIsArray(value: unknown): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error("Expected an array for block input value");
  }
}

function assertIsBlockInput(
  value: unknown
): asserts value is { data: { _template: string } & object } {
  const schema = yup.array().of(
    yup.object({
      data: yup
        .object({
          _template: yup.string().required(),
        })
        .required(),
    })
  );
  schema.validateSync(value);
}

function assertIsBlock(value: unknown): asserts value is BlockValue[] {
  const schema = yup.array().of(
    yup.object({
      template: yup.string().required(),
    })
  );
  schema.validateSync(value);
}

export const blocks = {
  resolve,
  build,
};
