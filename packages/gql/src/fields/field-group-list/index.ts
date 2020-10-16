import * as yup from "yup";
import { friendlyName } from "@forestryio/graphql-helpers";
import { GraphQLString, GraphQLObjectType, GraphQLList } from "graphql";
import { gql } from "../../gql";

import { builder } from "../../builder/ast-builder";
import { resolver } from "../../resolver/field-resolver";
import { sequential } from "../../util";

import type { Cache } from "../../cache";
import type { Field, TinaField } from "../index";
import type { DataSource } from "../../datasources/datasource";
import type { Definitions } from "../../builder/ast-builder";

export type FieldGroupListField = {
  label: string;
  name: string;
  type: "field_group_list";
  default?: string;
  fields: Field[];
  __namespace: string;
  config?: {
    required?: boolean;
  };
};
export type TinaFieldGroupListField = {
  label: string;
  name: string;
  component: "group-list";
  __typename: string;
  default?: string;
  fields: TinaField[];
  config?: {
    required?: boolean;
  };
};

export const fieldGroupList = {
  build: {
    field: async ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: FieldGroupListField;
      accumulator: Definitions[];
    }) => {
      const name = friendlyName(field, "GroupListField");

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
      field: FieldGroupListField;
      accumulator: Definitions[];
    }) => {
      const initialValueName = await builder.documentInitialValuesObject(
        cache,
        field,
        false,
        accumulator
      );
      return gql.listField({ name: field.name, value: initialValueName });
    },
    value: async ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: FieldGroupListField;
      accumulator: Definitions[];
    }) => {
      const valueName = await builder.documentDataObject(
        cache,
        field,
        false,
        accumulator
      );
      return gql.listField({ name: field.name, value: valueName });
    },
    input: async ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: FieldGroupListField;
      accumulator: Definitions[];
    }) => {
      return gql.listInputValue({
        name: field.name,
        value: await builder.documentDataInputObject(
          cache,
          field,
          false,
          accumulator
        ),
      });
    },
  },
  resolve: {
    field: async ({
      datasource,
      field,
    }: {
      datasource: DataSource;
      field: FieldGroupListField;
    }): Promise<TinaFieldGroupListField> => {
      const { type, ...rest } = field;
      const template = await resolver.documentFormObject(datasource, field);

      return {
        ...rest,
        ...template,
        component: "group-list",
        __typename: friendlyName(field, "GroupListField"),
      };
    },
    initialValue: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: FieldGroupListField;
      value: unknown;
    }) => {
      assertIsDataArray(value);
      return sequential(
        value,
        async (v: any) =>
          await resolver.documentInitialValuesObject(datasource, field, v)
      );
    },
    value: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: FieldGroupListField;
      value: unknown;
    }) => {
      assertIsDataArray(value);
      return sequential(
        value,
        async (v: any) =>
          await resolver.documentDataObject(datasource, field, v)
      );
    },
    input: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: FieldGroupListField;
      value: unknown;
    }): Promise<unknown> => {
      assertIsDataArray(value);

      return sequential(value, async (v) => {
        return await resolver.documentDataInputObject({
          data: v,
          template: field,
          datasource,
        });
      });
    },
  },
};

function assertIsDataArray(
  value: unknown
): asserts value is {
  [key: string]: unknown;
}[] {
  const schema = yup.array().of(yup.object({}));
  schema.validateSync(value);
}
