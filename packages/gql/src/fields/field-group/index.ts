import { friendlyName } from "@forestryio/graphql-helpers";
import * as yup from "yup";
import { gql } from "../../gql";

import { builders } from "../../builder";
import { resolver } from "../../resolver/field-resolver";

import type { Field, TinaField } from "../index";
import { BuildArgs, ResolveArgs } from "../";

export const fieldGroup = {
  build: {
    field: async ({
      cache,
      field,
      accumulator,
    }: BuildArgs<FieldGroupField>) => {
      const typename = friendlyName(field, "GroupField");
      const fieldsUnionName = await builders.buildTemplateOrFieldFormFields(
        cache,
        field,
        accumulator,
        false
      );
      accumulator.push(
        gql.formField(typename, [
          gql.fieldList({ name: "fields", type: fieldsUnionName }),
        ])
      );

      return gql.field({
        name: field.name,
        type: typename,
      });
    },
    initialValue: async ({
      cache,
      field,
      accumulator,
    }: BuildArgs<FieldGroupField>) => {
      const initialValueName = await builders.buildTemplateOrFieldValues(
        cache,
        field,
        accumulator,
        false
      );

      return gql.field({ name: field.name, type: initialValueName });
    },
    value: async ({
      cache,
      field,
      accumulator,
    }: BuildArgs<FieldGroupField>) => {
      const name = await builders.buildTemplateOrFieldData(
        cache,
        field,
        accumulator,
        false
      );
      return gql.field({ name: field.name, type: name });
    },
    input: async ({
      cache,
      field,
      accumulator,
    }: BuildArgs<FieldGroupField>) => {
      const name = await builders.buildTemplateOrFieldInput(
        cache,
        field,
        accumulator,
        false
      );
      return gql.inputValue(field.name, name);
    },
  },
  resolve: {
    field: async ({
      datasource,
      field,
    }: Omit<ResolveArgs<FieldGroupField>, "value">): Promise<
      TinaFieldGroupField
    > => {
      const { type, ...rest } = field;
      const template = await resolver.documentFormObject(
        datasource,
        field,
        false
      );

      return {
        ...rest,
        ...template,
        component: "group",
        __typename: friendlyName(field, "GroupField"),
      };
    },
    initialValue: async ({
      datasource,
      field,
      value,
    }: ResolveArgs<FieldGroupField>) => {
      assertIsData(value);

      return await resolver.initialValuesObject(datasource, field, value);
    },
    value: async ({
      datasource,
      field,
      value,
    }: ResolveArgs<FieldGroupField>) => {
      assertIsData(value);

      return await resolver.dataObject({
        datasource,
        resolvedTemplate: field,
        data: value,
      });
    },
    input: async ({
      datasource,
      field,
      value,
    }: ResolveArgs<FieldGroupField>) => {
      assertIsData(value);

      return await resolver.documentDataInputObject({
        data: value,
        template: field,
        datasource,
      });
    },
  },
};

function assertIsData(
  value: unknown
): asserts value is {
  [key: string]: unknown;
} {
  const schema = yup.object({}).required();
  schema.validateSync(value);
}

/**
 * The Forestry definition for Field Group
 *
 * ```yaml
 * label: Some Name
 * name: some-name
 * type: field_group
 * fields:
 *   - label: Some nested field
 *     name: my-field
 *     type: Text
 * ```
 */
export type FieldGroupField = {
  label: string;
  name: string;
  type: "field_group";
  default?: string;
  fields: Field[];
  config?: {
    required?: boolean;
  };
  __namespace: string;
};
export type TinaFieldGroupField = {
  label: string;
  name: string;
  component: "group";
  __typename: string;
  default?: string;
  fields: TinaField[];
  config?: {
    required?: boolean;
  };
};
export type FieldGroupValue = {
  [key: string]: unknown;
};
