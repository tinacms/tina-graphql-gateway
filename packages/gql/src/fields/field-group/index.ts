import { GraphQLString, GraphQLObjectType } from "graphql";
import * as yup from "yup";

import { builder } from "../../builder";
import { resolver } from "../../resolver/field-resolver";

import type { Cache } from "../../cache";
import type { Field, TinaField } from "../index";
import type { DataSource } from "../../datasources/datasource";

export const fieldGroup = {
  build: {
    field: async ({
      cache,
      field,
    }: {
      cache: Cache;
      field: FieldGroupField;
    }) => {
      return cache.build(
        new GraphQLObjectType({
          name: `${field.__namespace}${field.label}GroupField`,
          fields: {
            name: { type: GraphQLString },
            label: { type: GraphQLString },
            component: { type: GraphQLString },
            fields: {
              type: await builder.documentFormFieldsUnion(cache, field),
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
      field: FieldGroupField;
    }) => {
      return {
        type: await builder.documentInitialValuesObject(cache, field),
      };
    },
    value: async ({
      cache,
      field,
    }: {
      cache: Cache;
      field: FieldGroupField;
    }) => {
      return { type: await builder.documentDataObject(cache, field) };
    },
    input: async ({
      cache,
      field,
    }: {
      cache: Cache;
      field: FieldGroupField;
    }) => {
      return { type: await builder.documentDataInputObject(cache, field) };
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
        __typename: `${field.__namespace}${field.label}GroupField`,
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
      return await resolver.documentDataObject(datasource, field, value);
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
  const schema = yup.object({});
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
