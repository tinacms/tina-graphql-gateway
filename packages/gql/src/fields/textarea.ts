import type { DataSource } from "../datasources/datasource";
import { GraphQLString, GraphQLObjectType } from "graphql";
import type { Cache } from "../schema-builder";

export type TextareaField = {
  label: string;
  name: string;
  type: "textarea";
  component: "textarea";
  default: string;
  config?: {
    required?: boolean;
  };
  __typename: "TextareaFormField";
};

const build = {
  field: ({ cache, field }: { cache: Cache; field: TextareaField }) => {
    return cache.build(
      new GraphQLObjectType({
        name: "TextareaFormField",
        fields: {
          config: {
            type: cache.build(
              new GraphQLObjectType({
                name: "Config",
                fields: { required: { type: GraphQLString } },
              })
            ),
          },
        },
      })
    );
  },
  value: ({ cache, field }: { cache: Cache; field: TextareaField }) => {
    return { type: GraphQLString };
  },
};

const resolve = {
  field: ({ field }: { field: TextareaField }) => {
    const { ...rest } = field;
    return {
      ...rest,
      component: "textarea",
      config: rest.config || {
        required: false,
      },
      __typename: "TextareaFormField",
    };
  },
  value: async ({
    datasource,
    field,
    value,
  }: {
    datasource: DataSource;
    field: TextareaField;
    value: string;
  }) => {
    return value;
  },
};

export const textarea = {
  resolve,
  build,
};
