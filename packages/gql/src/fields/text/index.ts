import type { DataSource } from "../../datasources/datasource";
import { GraphQLString, GraphQLObjectType } from "graphql";
import type { Cache } from "../../schema-builder";

export type TextField = {
  label: string;
  name: string;
  type: "text";
  default?: string;
  config?: {
    required?: boolean;
  };
};

export type TinaTextField = {
  label: string;
  name: string;
  component: "text";
  default?: string;
  config?: {
    required?: boolean;
  };
  __typename: "TextFormField";
};

const build = {
  field: ({ cache, field }: { cache: Cache; field: TextField }) => {
    return cache.build(
      new GraphQLObjectType({
        name: "TextFormField",
        fields: {
          name: { type: GraphQLString },
          label: { type: GraphQLString },
          component: { type: GraphQLString },
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
    const { type, ...rest } = field;
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
};

export const text = {
  resolve,
  build,
};
