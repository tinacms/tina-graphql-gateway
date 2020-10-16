import _ from "lodash";
import * as yup from "yup";
import { FieldDefinitionNode, InputValueDefinitionNode } from "graphql";
import { gql } from "../../gql";

import { friendlyName } from "@forestryio/graphql-helpers";
import { builder } from "../../builder";
import { resolver } from "../../resolver/field-resolver";
import { sequential } from "../../util";

import type { BuildArgs, ResolveArgs } from "../";
import type { TinaTemplateData } from "../../types";

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
    accumulator,
  }: BuildArgs<BlocksField>) => Promise<string>;
  initialValue: ({
    cache,
    field,
    accumulator,
  }: BuildArgs<BlocksField>) => Promise<FieldDefinitionNode>;
  value: ({
    cache,
    field,
    accumulator,
  }: BuildArgs<BlocksField>) => Promise<FieldDefinitionNode>;
  input: ({
    cache,
    field,
    accumulator,
  }: BuildArgs<BlocksField>) => Promise<InputValueDefinitionNode>;
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
  }: Omit<ResolveArgs<BlocksField>, "value">) => Promise<TinaBlocksField>;
  initialValue: ({
    datasource,
    field,
    value,
  }: ResolveArgs<BlocksField>) => Promise<
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
  }: ResolveArgs<BlocksField>) => Promise<unknown>;
  input: ({
    datasource,
    field,
    value,
  }: ResolveArgs<BlocksField>) => Promise<
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
    field: async ({ cache, field, accumulator }) => {
      const name = friendlyName(field, "BlocksField");

      const templateName = friendlyName(field, "BlocksFieldTemplates");
      const possibleTemplates = await sequential(
        field.template_types,
        async (templateSlug) => {
          const template = await cache.datasource.getTemplate(templateSlug);
          const name = await builder.documentFormObject(
            cache,
            template,
            accumulator
          );
          // This might cause issues, need to make sure the resolver which is looking
          // for the template field uses the same formatting
          return { name: friendlyName(templateSlug, "", true), value: name };
        }
      );

      accumulator.push(
        gql.object({
          name: templateName,
          fields: _.flatten(possibleTemplates).map((formObject) =>
            gql.field({ name: formObject.name, type: formObject.value })
          ),
        })
      );

      accumulator.push(
        gql.object({
          name: name,
          fields: [
            gql.string("name"),
            gql.string("label"),
            gql.string("component"),
            gql.field({ name: "templates", type: templateName }),
          ],
        })
      );

      return name;
    },
    initialValue: async ({ cache, field, accumulator }) => {
      const fieldUnionName = await builder.initialValuesUnion({
        cache,
        templates: field.template_types,
        returnTemplate: true,
        accumulator,
      });

      return gql.fieldList({ name: field.name, type: fieldUnionName });
    },
    value: async ({ cache, field, accumulator }) => {
      const fieldUnionName = await builder.documentDataUnion({
        cache,
        templates: field.template_types,
        returnTemplate: true,
        accumulator,
      });
      return gql.fieldList({ name: field.name, type: fieldUnionName });
    },
    input: async ({ cache, field, accumulator }) => {
      const name = await builder.documentDataTaggedUnionInputObject({
        cache,
        templateSlugs: field.template_types,
        accumulator,
      });

      return gql.inputValueList(field.name, name);
    },
  },
  resolve: {
    field: async ({ datasource, field }): Promise<TinaBlocksField> => {
      const templates: { [key: string]: TinaTemplateData } = {};
      await sequential(field.template_types, async (templateSlug) => {
        const template = await datasource.getTemplate(templateSlug);
        templates[templateSlug] = await resolver.documentFormObject(
          datasource,
          template
        );
      });

      return {
        ...field,
        component: "blocks" as const,
        templates,
        __typename: friendlyName(field, "BlocksField"),
      };
    },
    initialValue: async ({ datasource, field, value }) => {
      assertIsBlockValueArray(value);
      return await sequential(value, async (item) => {
        const templateData = await datasource.getTemplate(item.template);
        const itemValue = await resolver.documentInitialValuesObject(
          datasource,
          templateData,
          item
        );

        assertIsBlockInitialValue(itemValue);

        return itemValue;
      });
    },
    value: async ({ datasource, field, value }) => {
      assertIsBlockValueArray(value);

      return await sequential(value, async (item) => {
        const templateData = await datasource.getTemplate(item.template);
        const data = await resolver.documentDataObject({
          datasource,
          resolvedTemplate: templateData,
          data: item,
        });
        assertIsObject(data);

        const value = { template: item.template, ...data };

        assertIsBlockValue(value);

        return value;
      });
    },
    input: async ({ datasource, field, value }) => {
      // FIXME: we should validate that only one key was passed
      assertIsArray(value);

      return await sequential(value, async (item) => {
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
      });
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
