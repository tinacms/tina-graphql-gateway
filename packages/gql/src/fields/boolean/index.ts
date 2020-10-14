import { GraphQLString, GraphQLObjectType } from "graphql";
import { gql } from "../../gql";

import type { Cache } from "../../cache";
import type { DataSource } from "../../datasources/datasource";
import type { Definitions } from "../../builder/ast-builder";

export const boolean = {
  build: {
    field: async ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: BooleanField;
      accumulator: Definitions[];
    }) => {
      accumulator.push({
        kind: "ObjectTypeDefinition",
        name: {
          kind: "Name",
          value: "BooleanField",
        },
        interfaces: [],
        directives: [],
        fields: [
          gql.string("name"),
          gql.string("label"),
          gql.string("component"),
        ],
      });

      return "BooleanField";
    },
    initialValue: ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: BooleanField;
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
      field: BooleanField;
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
      field: BooleanField;
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
      field: BooleanField;
    }): TinaBooleanField => {
      const { type, ...rest } = field;
      return {
        ...rest,
        component: "toggle",
        config: rest.config || {
          required: false,
        },
        __typename: "BooleanField",
      };
    },
    initialValue: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: BooleanField;
      value: unknown;
    }): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected initial value of type ${typeof value} for resolved text value`
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
      field: BooleanField;
      value: unknown;
    }): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected value of type ${typeof value} for resolved text value`
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
      field: BooleanField;
      value: unknown;
    }): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected input value of type ${typeof value} for resolved text value`
        );
      }
      return value;
    },
  },
};

export type BooleanField = {
  label: string;
  name: string;
  type: "boolean";
  default?: string;
  config?: {
    required?: boolean;
  };
  __namespace: string;
};

export type TinaBooleanField = {
  label: string;
  name: string;
  component: "toggle";
  default?: string;
  config?: {
    required?: boolean;
  };
  __typename: "BooleanField";
};
