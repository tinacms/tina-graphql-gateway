import _ from "lodash";
import {
  friendlyName,
  slugify,
  templateTypeName,
} from "@forestryio/graphql-helpers";

import { gql } from "../../gql";
import { resolver } from "../../resolver";
import { sequential, assertShape } from "../../util";
import { assertIsArray, assertIsBlockValueArray } from "../";

import type { FieldDefinitionNode, InputValueDefinitionNode } from "graphql";
import type { BuildArgs, ResolveArgs } from "../";
import type { TinaTemplateData } from "../../types";

export const blocks: Blocks = {
  build: {
    field: async ({ cache, field, accumulator }) => {
      const typename = friendlyName(field, "BlocksField");
      const templateName = friendlyName(field, "BlocksFieldTemplates");

      accumulator.push(
        gql.object({
          name: templateName,
          fields: field.template_types.map((t) => {
            return gql.field({
              name: friendlyName(t, "", true),
              type: friendlyName(t, "Form"),
            });
          }),
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
      accumulator.push(
        gql.input({
          name: friendlyName(field.name, "Input"),
          fields: field.template_types.map((template) =>
            gql.inputValue(
              friendlyName(template, "", true),
              templateTypeName(template, "Input", true)
            )
          ),
        })
      );

      return gql.inputValueList(field.name, friendlyName(field.name, "Input"));
    },
  },
  resolve: {
    field: async ({ datasource, field }): Promise<TinaBlocksField> => {
      const templates: { [key: string]: TinaTemplateData } = {};
      await sequential(field.template_types, async (templateSlug) => {
        const template = await datasource.getTemplate(templateSlug);
        templates[friendlyName(templateSlug, "", true)] = await resolver.form({
          datasource,
          template,
        });
      });

      return {
        ...field,
        component: "blocks" as const,
        templates,
        __typename: friendlyName(field, "BlocksField"),
      };
    },
    initialValue: async ({ datasource, value }) => {
      assertIsBlockValueArray(value);

      return await sequential(value, async (item) => {
        const templateData = await datasource.getTemplate(item.template);
        const itemValue = await resolver.values({
          datasource,
          template: templateData,
          data: item,
        });

        return {
          ...itemValue,
          _template: friendlyName(itemValue._template, "", true),
        };
      });
    },
    value: async ({ datasource, value }) => {
      assertIsBlockValueArray(value);

      return await sequential(value, async (item) => {
        const templateData = await datasource.getTemplate(item.template);
        const data = await resolver.data({
          datasource,
          template: templateData,
          data: item,
        });

        return { template: item.template, ...data };
      });
    },
    input: async ({ datasource, value }) => {
      assertIsArray(value);

      return await sequential(value, async (item) => {
        assertShape<object>(item, (yup) => yup.object({}));

        const key = Object.keys(item)[0];
        const data = Object.values(item)[0];

        const resolvedData = await resolver.input({
          data,
          template: await datasource.getTemplate(slugify(key)),
          datasource,
        });

        return {
          template: slugify(key),
          ...resolvedData,
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
