import { friendlyName } from "@forestryio/graphql-helpers";
import * as yup from "yup";
import { gql } from "../../gql";

import {
  builder,
  buildTemplateOrFieldValues,
  buildTemplateOrFieldData,
  builders,
} from "../../builder";
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
      const name = friendlyName(field, "GroupField");
      // const fieldsUnionName = await builder.documentFormFieldsUnion(
      //   cache,
      //   field,
      //   accumulator
      // );
      const fieldsUnionName = await builders.buildTemplateOrFieldValues(
        cache,
        field,
        accumulator
      );

      accumulator.push(
        gql.object({
          name,
          fields: [
            gql.string("name"),
            gql.string("label"),
            gql.string("component"),
            gql.fieldList({ name: "fields", type: fieldsUnionName }),
          ],
        })
      );

      return name;
    },
    initialValue: async ({
      cache,
      field,
      accumulator,
    }: BuildArgs<FieldGroupField>) => {
      const initialValueName = await builder.documentInitialValuesObject(
        cache,
        field,
        false,
        accumulator
      );

      return gql.field({ name: field.name, type: initialValueName });
    },
    value: async ({
      cache,
      field,
      accumulator,
    }: BuildArgs<FieldGroupField>) => {
      const name = await buildTemplateOrFieldData(cache, field, accumulator);
      return gql.field({ name: field.name, type: `${name}Data` });
    },
    input: async ({
      cache,
      field,
      accumulator,
    }: BuildArgs<FieldGroupField>) => {
      return gql.inputValue(
        field.name,
        await builder.documentDataInputObject(cache, field, false, accumulator)
      );
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
      const template = await resolver.documentFormObject(datasource, field);

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

      return await resolver.documentInitialValuesObject(
        datasource,
        field,
        value
      );
    },
    value: async ({
      datasource,
      field,
      value,
    }: ResolveArgs<FieldGroupField>) => {
      assertIsData(value);

      return await resolver.documentDataObject({
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
