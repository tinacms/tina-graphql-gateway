import type { DataSource } from "../datasources/datasource";
import { GraphQLString, GraphQLObjectType } from "graphql";
import type { Cache } from "../schema-builder";

export type TextField = {
  label: string;
  name: string;
  type: "text";
  default: string;
  config?: {
    required?: boolean;
  };
};

export type TinaTextField = {
  label: string;
  name: string;
  type: "text";
  component: "text";
  default: string;
  config?: {
    required?: boolean;
  };
  __typename: "TextFormField";
};

const build = {
  field: ({ cache, field }: { cache: Cache; field: TextField }) => {
    return cache.build(
      new GraphQLObjectType({
        name: "TextareaFormField",
        fields: {
          name: { type: GraphQLString },
          label: { type: GraphQLString },
          type: { type: GraphQLString },
          component: { type: GraphQLString },
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
  value: ({ cache, field }: { cache: Cache; field: TextField }) => {
    return { type: GraphQLString };
  },
};

const resolve = {
  field: ({ field }: { field: TextField }): TinaTextField => {
    const { ...rest } = field;
    return {
      ...rest,
      component: "text",
      config: rest.config || {
        required: false,
      },
      __typename: "TextFormField",
    };
  },
  value: async ({
    datasource,
    field,
    value,
  }: {
    datasource: DataSource;
    field: TinaTextField;
    value: string;
  }) => {
    return value;
  },
};

export const text = {
  resolve,
  build,
};
