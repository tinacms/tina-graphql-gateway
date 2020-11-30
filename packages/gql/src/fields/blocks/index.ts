import _ from "lodash";
import { FieldDefinitionNode, InputValueDefinitionNode } from "graphql";
import { gql } from "../../gql";

import { friendlyName } from "@forestryio/graphql-helpers";
import { builder } from "../../builder";
import { resolver } from "../../resolver/field-resolver";
import { sequential } from "../../util";

import {
  assertIsArray,
  assertIsBlockInitialValue,
  assertIsBlockInput,
  assertIsBlockValue,
  assertIsBlockValueArray,
  assertIsObject,
} from "../";
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
  }: BuildArgs<BlocksField>) => Promise<FieldDefinitionNode>;
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
  }: BuildArgs<BlocksField>) => Promise<unknown>;
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
  input: ({ datasource, field, value }: ResolveArgs<BlocksField>) => unknown;
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
    field: async ({ field, accumulator }) => {
      const typename = friendlyName(field, "BlocksField");
      const templateName = friendlyName(field, "BlocksFieldTemplates");

      accumulator.push(
        gql.union({
          name: templateName,
          types: field.template_types.map((t) => friendlyName(t, "Form")),
        })
      );

      accumulator.push(
        gql.formField(typename, [
          gql.field({ name: "templates", type: templateName }),
        ])
      );

      return gql.field({
        name: field.name,
        type: typename,
      });
    },
    initialValue: async ({ field, accumulator }) => {
      const name = `${friendlyName(field)}Values`;

      accumulator.push(
        gql.union({
          name: name,
          types: field.template_types.map((t) => friendlyName(t, "Values")),
        })
      );

      return gql.fieldList({ name: field.name, type: name });
    },
    value: async ({ field, accumulator }) => {
      const fieldUnionName = friendlyName(field, "Data");
      accumulator.push(
        gql.union({
          name: fieldUnionName,
          types: field.template_types.map((t) => friendlyName(t, "Data")),
        })
      );
      return gql.fieldList({ name: field.name, type: fieldUnionName });
    },
    input: async ({ cache, field, accumulator }) => {
      // const name = await builder.documentDataTaggedUnionInputObject({
      //   cache,
      //   templateSlugs: field.template_types,
      //   accumulator,
      // });
      // return gql.inputValueList(field.name, name);
    },
  },
  resolve: {
    field: async ({ datasource, field }): Promise<TinaBlocksField> => {
      const templates: { [key: string]: TinaTemplateData } = {};
      await sequential(field.template_types, async (templateSlug) => {
        const template = await datasource.getTemplate(templateSlug);
        templates[
          friendlyName(templateSlug, "", true)
        ] = await resolver.documentFormObject(datasource, template);
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
      // assertShape<BlockValue[]>(value, blockInputSchema)

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
