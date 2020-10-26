import { GraphQLString, GraphQLObjectType } from "graphql";

import type { Cache } from "../../cache";
import type { DataSource } from "../../datasources/datasource";

export const textarea = {
  build: {
    field: async ({ cache, field }: { cache: Cache; field: TextareaField }) => {
      return await cache.build(
        "TextareaField",
        async () =>
          new GraphQLObjectType({
            name: "TextareaField",
            fields: {
              name: { type: GraphQLString },
              label: { type: GraphQLString },
              component: { type: GraphQLString },
              description: { type: GraphQLString },
            },
          })
      );
    },
    initialValue: ({
      cache,
      field,
    }: {
      cache: Cache;
      field: TextareaField;
    }) => {
      return { type: GraphQLString };
    },
    value: ({ cache, field }: { cache: Cache; field: TextareaField }) => {
      return { type: GraphQLString };
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
