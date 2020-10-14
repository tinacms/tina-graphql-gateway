import { GraphQLString, GraphQLObjectType } from "graphql";
import { gql } from "../../gql";

import type { Cache } from "../../cache";
import type { DataSource } from "../../datasources/datasource";
import type { Definitions } from "../../builder/ast-builder";

export const text = {
  build: {
    field: async ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: TextField;
      accumulator: Definitions[];
    }) => {
      accumulator.push({
        kind: "ObjectTypeDefinition",
        name: {
          kind: "Name",
          value: "TextField",
        },
        interfaces: [],
        directives: [],
        fields: [
          gql.string("name"),
          gql.string("label"),
          gql.string("component"),
        ],
      });

      return "TextField";
      // return await cache.build(
      //   "TextField",
      //   async () =>
      //     new GraphQLObjectType({
      //       name: "TextField",
      //       fields: {
      //         name: { type: GraphQLString },
      //         label: { type: GraphQLString },
      //         component: { type: GraphQLString },
      //       },
      //     })
      // );
    },
    initialValue: ({ cache, field }: { cache: Cache; field: TextField }) => {
      return gql.string(field.name);
    },
    value: ({ cache, field }: { cache: Cache; field: TextField }) => {
      return gql.string(field.name);
    },
    input: ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: TextField;
      accumulator: Definitions[];
    }) => {
      return gql.inputString(field.name);
    },
  },
  resolve: {
    field: ({ field }: { field: TextField }): TinaTextField => {
      const { type, ...rest } = field;
      return {
        ...rest,
        component: "text",
        config: rest.config || {
          required: false,
        },
        __typename: "TextField",
      };
    },
    initialValue: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: TextField;
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
      field: TextField;
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
      field: TextField;
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

export type TextField = {
  label: string;
  name: string;
  type: "text";
  default?: string;
  config?: {
    required?: boolean;
  };
  __namespace: string;
};

export type TinaTextField = {
  label: string;
  name: string;
  component: "text";
  default?: string;
  config?: {
    required?: boolean;
  };
  __typename: "TextField";
};
