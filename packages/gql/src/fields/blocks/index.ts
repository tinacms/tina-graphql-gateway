import _ from "lodash";
import * as yup from "yup";
import {
  printType,
  GraphQLString,
  GraphQLInputObjectType,
  getNamedType,
  GraphQLObjectType,
  GraphQLList,
  GraphQLType,
} from "graphql";

import { friendlyName } from "@forestryio/graphql-helpers";
import { builder } from "../../builder";
import { resolver } from "../../resolver/field-resolver";

import type { Cache } from "../../cache";
import type { TinaTemplateData } from "../../types";
import type { DataSource } from "../../datasources/datasource";

export interface Build {
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
  field: ({
    cache,
    field,
  }: BuildArgs) => Promise<GraphQLObjectType<BlocksField, any>>;
  initialValue: ({
    cache,
    field,
  }: {
    cache: Cache;
    field: BlocksField;
  }) => Promise<{ type: GraphQLList<GraphQLType> }>;
  value: ({
    cache,
    field,
  }: {
    cache: Cache;
    field: BlocksField;
  }) => Promise<{ type: GraphQLList<GraphQLType> }>;
  input: ({
    cache,
    field,
  }: {
    cache: Cache;
    field: BlocksField;
  }) => Promise<GraphQLList<GraphQLType>>;
}

export interface Resolve {
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
   *     section: {
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
  field: ({
    datasource,
    field,
  }: {
    datasource: DataSource;
    field: BlocksField;
  }) => Promise<TinaBlocksField>;
  initialValue: ({
    datasource,
    field,
    value,
  }: {
    datasource: DataSource;
    field: BlocksField;
    value: unknown;
  }) => Promise<
    {
      __typename: string;
      // FIXME: this should exist for blocks, but
      _template: string;
      [key: string]: unknown;
    }[]
  >;
  value: ({
    datasource,
    field,
    value,
  }: {
    datasource: DataSource;
    field: BlocksField;
    value: unknown;
  }) => Promise<unknown>;
  input: ({
    datasource,
    field,
    value,
  }: {
    datasource: DataSource;
    field: BlocksField;
    value: unknown;
  }) => Promise<
    {
      template: string;
      [key: string]: unknown;
    }[]
  >;
}

export interface Blocks {
  /**
   * Build properties are functions which build the various schemas for objects
   * related to block data
   *
   * The build process is done ahead of time and can be cached as a static GraphQL SDL file
   *
   */
  build: Build;
  resolve: Resolve;
}

export const blocks: Blocks = {
  build: {
    field: async ({
      cache,
      field,
    }: BuildArgs): Promise<GraphQLObjectType<BlocksField, any>> => {
      const templateForms: {
        [key: string]: { type: GraphQLObjectType<any, any> };
      } = {};
      await Promise.all(
        field.template_types.map(async (templateSlug) => {
          const template = await cache.datasource.getTemplate(templateSlug);
          templateForms[templateSlug] = {
            type: await builder.documentFormObject(cache, template),
          };
        })
      );

      return await cache.build(
        new GraphQLObjectType<BlocksField>({
          name: friendlyName(field, "BlocksField"),
          fields: {
            name: { type: GraphQLString },
            label: { type: GraphQLString },
            component: { type: GraphQLString },
            templates: {
              type: await cache.build(
                new GraphQLObjectType({
                  name: friendlyName(field, "BlocksFieldTemplates"),
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
            returnTemplate: true,
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
            returnTemplate: true,
          })
        ),
      };
    },
    input: async ({ cache, field }: { cache: Cache; field: BlocksField }) => {
      const templates = await Promise.all(
        field.template_types.map(
          async (templateSlug) =>
            await cache.datasource.getTemplate(templateSlug)
        )
      );

      const templateTypes = await Promise.all(
        templates.map(async (template) => {
          return builder.documentDataInputObject(cache, template, true);
        })
      );

      const accum: { [key: string]: { type: GraphQLInputObjectType } } = {};
      templateTypes.forEach((template) => {
        accum[getNamedType(template).toString()] = { type: template };
      });
      return await cache.build(
        GraphQLList(
          new GraphQLInputObjectType({
            name: friendlyName(field, "BlocksInput"),
            fields: accum,
          })
        )
      );
    },
  },
  resolve: {
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
          const template = await datasource.getTemplate(templateSlug);
          templates[templateSlug] = await resolver.documentFormObject(
            datasource,
            template
          );
        })
      );

      return {
        ...field,
        component: "blocks" as const,
        templates,
        __typename: friendlyName(field, "BlocksField"),
      };
    },
    initialValue: async ({ datasource, field, value }) => {
      assertIsBlockValueArray(value);
      return await Promise.all(
        value.map(async (item) => {
          const templateData = await datasource.getTemplate(item.template);
          const itemValue = await resolver.documentInitialValuesObject(
            datasource,
            templateData,
            item
          );

          assertIsBlockInitialValue(itemValue);

          return itemValue;
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
    }) => {
      assertIsBlockValueArray(value);

      return await Promise.all(
        value.map(async (item) => {
          const templateData = await datasource.getTemplate(item.template);
          const data = await resolver.documentDataObject(
            datasource,
            templateData,
            item
          );
          assertIsObject(data);

          const value = { template: item.template, ...data };

          assertIsBlockValue(value);

          return value;
        })
      );
    },
    input: async ({ datasource, field, value }) => {
      // FIXME: we should validate that only one key was passed
      assertIsArray(value);

      return await Promise.all(
        value.map(async (item) => {
          assertIsBlockInput(item);
          const data = Object.values(item)[0];
          const template = await datasource.getTemplate(data.template);
          const inputData = await resolver.documentDataInputObject({
            data,
            template,
            datasource,
          });
          return {
            template: data.template,
            ...inputData,
          };
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
): asserts value is { data: { template: string } & object } {
  assertIsObject(value);
  const data = Object.values(value)[0];
  const schema = yup
    .object({
      template: yup.string().required(),
    })
    .required();
  try {
    schema.validateSync(data);
  } catch (e) {
    console.log(value);
    throw new Error(`Failed to assertIsBlockInput - ${e.message}`);
  }
}

function assertIsObject(value: unknown): asserts value is object {
  const schema = yup.object().required();
  schema.validateSync(value);
}

function assertIsBlockInitialValue(
  value: unknown
): asserts value is BlockInitialValue {
  const schema = yup.object({
    _template: yup.string().required(),
  });
  try {
    schema.validateSync(value);
  } catch (e) {
    console.log(value);
    throw new Error(`Failed to assertIsBlockInitialValue - ${e.message}`);
  }
}
function assertIsBlockValue(value: unknown): asserts value is BlockValue {
  const schema = yup.object({
    template: yup.string().required(),
  });
  try {
    schema.validateSync(value);
  } catch (e) {
    console.log(value);
    throw new Error(`Failed to assertIsBlockValue - ${e.message}`);
  }
}
function assertIsBlockValueArray(
  value: unknown
): asserts value is BlockValue[] {
  const schema = yup.array().of(
    yup.object({
      template: yup.string().required(),
    })
  );
  try {
    schema.validateSync(value);
  } catch (e) {
    console.log(value);
    throw new Error(`Failed to assertIsBlockValueArray - ${e.message}`);
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
  template: string;
  [key: string]: unknown;
};

type BlockInitialValue = {
  _template: string;
  [key: string]: unknown;
};

type BuildArgs = { cache: Cache; field: BlocksField };
