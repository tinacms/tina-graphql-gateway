import _ from "lodash";
import * as yup from "yup";
import {
  GraphQLString,
  GraphQLInputObjectType,
  getNamedType,
  GraphQLObjectType,
  GraphQLList,
} from "graphql";

import { builder } from "../../builder";
import {
  resolveTemplate,
  resolveData,
  resolveDocumentInputData,
  resolveInitialValues,
} from "../../resolver/field-resolver";

import type { Cache } from "../../cache";
import type { TinaTemplateData } from "../../types";
import type { DataSource } from "../../datasources/datasource";
import type { ResolvedData } from "../../resolver/field-resolver";

export const blocks = {
  /**
   * Build properties are functions which build the various schemas for objects
   * related to block data
   *
   * The build process is done ahead of time and can be cached as a static GraphQL SDL file
   *
   */
  build: {
    /**
     * Builds a union type which adheres to the [Tina Block](https://tinacms.org/docs/plugins/fields/blocks/) shape.
     *
     * Since blocks need to be unique from one another depending on the templates they support, this is field
     * builds a union which is namespaced by the template name:
     *
     * Given the following template definition:
     * ```yaml
     * label: MyPage
     * fields:
     * - name: sections
     *   type: blocks
     *   label: Sections
     *   template_types:
     *     - cta
     *     - hero
     * ```

     * Builds:
     * ```graphql
     * type MyPageSectionsBlocksField {
     *   name: String
     *   label: String
     *   component: String
     *   templates: SomeTemplateSectionsBlocksFieldTemplates
     * }
     * type SomeTemplateSectionsBlocksFieldTemplates {
     *   sectionTemplateFields: SectionForm
     * }
     * type SectionForm {
     *   fields: [MyPageSectionFormFields]
     * }
     * union MyPageSectionFormFields = CtaFormFields | HeroFormFields
     * ```
     */
    field: async ({
      cache,
      field,
    }: BuildArgs): Promise<GraphQLObjectType<BlocksField, any>> => {
      const templateForms: {
        [key: string]: { type: GraphQLObjectType<any, any> };
      } = {};
      await Promise.all(
        field.template_types.map(async (templateSlug) => {
          const template = await cache.datasource.getTemplate({
            slug: templateSlug,
          });
          templateForms[template.label] = {
            type: await builder.documentFormObject(cache, template),
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
          await builder.initialValuesUnion({
            cache,
            templates: field.template_types,
          })
        ),
      };
    },
    value: async ({ cache, field }: { cache: Cache; field: BlocksField }) => {
      return {
        type: GraphQLList(
          await builder.documentDataUnion({
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
          return builder.documentDataInputObject(cache, template);
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
  },
  resolve: {
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
    }: {
      datasource: DataSource;
      field: BlocksField;
    }): Promise<TinaBlocksField> => {
      const templates: { [key: string]: TinaTemplateData } = {};
      await Promise.all(
        field.template_types.map(async (templateSlug) => {
          const template = await datasource.getTemplate({
            slug: templateSlug,
          });
          templates[template.label] = await resolveTemplate(
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
    }: {
      datasource: DataSource;
      field: BlocksField;
      value: unknown;
    }): Promise<ResolvedData[]> => {
      assertIsBlock(value);
      return await Promise.all(
        value.map(async (item) => {
          const { _template, ...rest } = item;
          const templateData = await datasource.getTemplate({
            slug: _.lowerCase(_template),
          });
          return {
            _template: `${_template}TemplateFields`,
            ...(await resolveInitialValues(datasource, templateData, rest)),
          };
        })
      );
    },
    value: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: BlocksField;
      value: unknown;
    }): Promise<ResolvedData[]> => {
      assertIsBlock(value);

      return await Promise.all(
        value.map(async (item) => {
          const { _template, ...rest } = item;
          const templateData = await datasource.getTemplate({
            slug: _.lowerCase(_template),
          });
          return await resolveData(datasource, templateData, rest);
        })
      );
    },
    input: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: BlocksField;
      value: unknown;
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
  assertIsObject(value);
  const data = Object.values(value)[0];
  const schema = yup
    .object({
      _template: yup.string().required(),
    })
    .required();
  try {
    schema.validateSync(data);
  } catch (e) {
    console.log(value);
    throw new Error(`Failed to assertIsBlockInput`);
  }
}

function assertIsObject(value: unknown): asserts value is object {
  const schema = yup.object().required();
  schema.validateSync(value);
}

function assertIsBlock(value: unknown): asserts value is BlockValue[] {
  const schema = yup.array().of(
    yup.object({
      _template: yup.string().required(),
    })
  );
  try {
    schema.validateSync(value);
  } catch (e) {
    console.log(value);
    throw new Error(`Failed to assertIsBlock`);
  }
}

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
  _template: string;
  [key: string]: unknown;
};

type BuildArgs = { cache: Cache; field: BlocksField };
