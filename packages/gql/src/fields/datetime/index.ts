import { GraphQLString, GraphQLObjectType } from "graphql";
import { gql } from "../../gql";

import type { Cache } from "../../cache";
import type { DataSource } from "../../datasources/datasource";
import type { Definitions } from "../../builder/ast-builder";

export const datetime = {
  build: {
    field: async ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: DatetimeField;
      accumulator: Definitions[];
    }) => {
      accumulator.push({
        kind: "ObjectTypeDefinition",
        name: {
          kind: "Name",
          value: "DatetimeField",
        },
        interfaces: [],
        directives: [],
        fields: [
          gql.string("name"),
          gql.string("label"),
          gql.string("component"),
        ],
      });

      return "DatetimeField";
    },
    initialValue: ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: DatetimeField;
      accumulator: Definitions[];
    }) => {
      return gql.string(field.name);
    },
    value: ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: DatetimeField;
      accumulator: Definitions[];
    }) => {
      return gql.string(field.name);
    },
    input: ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: DatetimeField;
      accumulator: Definitions[];
    }) => {
      return gql.inputString(field.name);
    },
  },
  resolve: {
    field: ({
      datasource,
      field,
    }: {
      datasource: DataSource;
      field: DatetimeField;
    }): TinaDatetimeField => {
      const { type, ...rest } = field;
      return {
        ...rest,
        component: "datetime",
        config: rest.config || {
          required: false,
        },
        __typename: "DatetimeField",
      };
    },
    initialValue: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: DatetimeField;
      value: unknown;
    }): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected initial value of type ${typeof value} for resolved datetime value`
        );
      }
      return value;
    },
    value: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: DatetimeField;
      value: unknown;
    }): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected value of type ${typeof value} for resolved datetime value`
        );
      }
      return value;
    },
    input: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: DatetimeField;
      value: unknown;
    }): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected input value of type ${typeof value} for resolved datetime value`
        );
      }
      return value;
    },
  },
};

export type DatetimeField = {
  label: string;
  name: string;
  type: "datetime";
  default?: string;
  config?: {
    required?: boolean;
  };
  __namespace: string;
};

export type TinaDatetimeField = {
  label: string;
  name: string;
  component: "datetime";
  default?: string;
  config?: {
    required?: boolean;
  };
  __typename: "DatetimeField";
};
