import { GraphQLString, GraphQLObjectType } from "graphql";
import { gql } from "../../gql";

import type { Cache } from "../../cache";
import type { DataSource } from "../../datasources/datasource";

export const textarea = {
  build: {
    field: async ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: TextareaField;
      accumulator: any[];
    }) => {
      accumulator.push({
        kind: "ObjectTypeDefinition",
        name: {
          kind: "Name",
          value: "TextareaField",
        },
        interfaces: [],
        directives: [],
        fields: [
          gql.string("name"),
          gql.string("label"),
          gql.string("component"),
        ],
      });

      return "TextareaField";
    },
    initialValue: ({
      cache,
      field,
    }: {
      cache: Cache;
      field: TextareaField;
    }) => {
      return gql.string(field.name);
    },
    value: ({ cache, field }: { cache: Cache; field: TextareaField }) => {
      return gql.string(field.name);
    },
    input: ({ cache, field }: { cache: Cache; field: TextareaField }) => {
      return GraphQLString;
    },
  },

  resolve: {
    field: ({ field }: { field: TextareaField }): TinaTextareaField => {
      const { type, ...rest } = field;
      return {
        ...rest,
        component: "textarea",
        config: rest.config || {
          required: false,
        },
        __typename: "TextareaField",
      };
    },
    initialValue: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: TextareaField;
      value: unknown;
    }): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected initial value of type ${typeof value} for resolved textarea value`
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
      field: TextareaField;
      value: unknown;
    }): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected value of type ${typeof value} for resolved textarea value`
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
      field: TextareaField;
      value: unknown;
    }): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected input value of type ${typeof value} for resolved textarea value`
        );
      }
      return value;
    },
  },
};

export type TextareaField = {
  label: string;
  name: string;
  type: "textarea";
  default?: string;
  config?: {
    required?: boolean;
  };
  __namespace: string;
};

export type TinaTextareaField = {
  label: string;
  name: string;
  component: "textarea";
  default?: string;
  config?: {
    required?: boolean;
  };
  __typename: "TextareaField";
};
