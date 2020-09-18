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

const builders = {
  formFieldBuilder: ({
    cache,
    field,
  }: {
    cache: Cache;
    field: TextareaField;
  }) => {
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
  dataFieldBuilder: ({
    cache,
    field,
  }: {
    cache: Cache;
    field: TextareaField;
  }) => {
    return { type: GraphQLString };
  },
};

const resolvers = {
  formFieldBuilder: (field: TextareaField) => {
    const { ...rest } = field;
    return {
      ...rest,
      component: "textarea",
      __typename: "TextareaFormField",
    };
  },
  dataFieldBuilder: async (
    datasource: DataSource,
    field: TextareaField,
    value: any
  ) => {
    return value;
  },
};

export const textarea = {
  resolvers,
  builders,
};
