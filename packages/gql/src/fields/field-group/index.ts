import { friendlyName } from "@forestryio/graphql-helpers";
import * as yup from "yup";
import { gql } from "../../gql";

import { builder } from "../../builder/ast-builder";
import { resolver } from "../../resolver/field-resolver";

import type { Cache } from "../../cache";
import type { Field, TinaField } from "../index";
import type { DataSource } from "../../datasources/datasource";
import type { Definitions } from "../../builder/ast-builder";

export const fieldGroup = {
  build: {
    field: async ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: FieldGroupField;
      accumulator: Definitions[];
    }) => {
      const name = friendlyName(field, "GroupField");
      const fieldsUnionName = await builder.documentFormFieldsUnion(
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
            gql.listField({ name: "fields", value: fieldsUnionName }),
          ],
        })
      );

      return name;
    },
    initialValue: async ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: FieldGroupField;
      accumulator: Definitions[];
    }) => {
      const initialValueName = await builder.documentInitialValuesObject(
        cache,
        field,
        false,
        accumulator
      );

      return gql.field({ name: field.name, value: initialValueName });
    },
    value: async ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: FieldGroupField;
      accumulator: Definitions[];
    }) => {
      const valueName = await builder.documentDataObject(
        cache,
        field,
        false,
        accumulator
      );
      return gql.field({ name: field.name, value: valueName });
    },
    input: async ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: FieldGroupField;
      accumulator: Definitions[];
    }) => {
      return gql.input(
        field.name,
        await builder.documentDataInputObject(cache, field, false, accumulator)
      );
    },
  },
  resolve: {
    field: async ({
      datasource,
      field,
    }: {
      datasource: DataSource;
      field: FieldGroupField;
    }): Promise<TinaFieldGroupField> => {
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
    }: {
      datasource: DataSource;
      field: FieldGroupField;
      value: unknown;
    }) => {
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
    }: {
      datasource: DataSource;
      field: FieldGroupField;
      value: unknown;
    }) => {
      assertIsData(value);
      return await resolver.documentDataObject(datasource, field, value);
    },
    input: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: FieldGroupField;
      value: unknown;
    }) => {
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
