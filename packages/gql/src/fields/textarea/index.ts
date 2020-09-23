import { GraphQLString, GraphQLObjectType } from "graphql";
import type { DataSource } from "../../datasources/datasource";
import type { Cache } from "../../schema-builder";

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

const build = {
  field: ({ cache, field }: { cache: Cache; field: TextareaField }) => {
    return cache.build(
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
  value: ({ cache, field }: { cache: Cache; field: TextareaField }) => {
    return { type: GraphQLString };
  },
};

const resolve = {
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
};

export const textarea = {
  resolve,
  build,
};
