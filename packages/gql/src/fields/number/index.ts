import { GraphQLString, GraphQLObjectType } from "graphql";
import { gql } from "../../gql";

import type { Cache } from "../../cache";
import type { DataSource } from "../../datasources/datasource";
import type { Definitions } from "../../builder/ast-builder";

export const number = {
  build: {
    field: async ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: NumberField;
      accumulator: Definitions[];
    }) => {
      accumulator.push({
        kind: "ObjectTypeDefinition",
        name: {
          kind: "Name",
          value: "NumberField",
        },
        interfaces: [],
        directives: [],
        fields: [
          gql.string("name"),
          gql.string("label"),
          gql.string("component"),
        ],
      });

      return "NumberField";
    },
    initialValue: ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: NumberField;
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
      field: NumberField;
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
      field: NumberField;
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
      field: NumberField;
    }): TinaNumberField => {
      const { type, ...rest } = field;
      return {
        ...rest,
        component: "number",
        config: rest.config || {
          required: false,
        },
        __typename: "NumberField",
      };
    },
    initialValue: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: NumberField;
      value: unknown;
    }): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected initial value of type ${typeof value} for resolved number value`
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
      field: NumberField;
      value: unknown;
    }): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected value of type ${typeof value} for resolved number value`
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
      field: NumberField;
      value: unknown;
    }): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected input value of type ${typeof value} for resolved number value`
        );
      }
      return value;
    },
  },
};

export type NumberField = {
  label: string;
  name: string;
  type: "number";
  default?: string;
  config?: {
    required?: boolean;
  };
  __namespace: string;
};

export type TinaNumberField = {
  label: string;
  name: string;
  component: "number";
  default?: string;
  config?: {
    required?: boolean;
  };
  __typename: "NumberField";
};
