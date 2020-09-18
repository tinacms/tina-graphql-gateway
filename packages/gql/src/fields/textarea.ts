import { GraphQLString, GraphQLObjectType } from "graphql";
import type { Cache } from "../schema-builder";

export type TextareaField = {
  label: string;
  name: string;
  type: "textarea";
  default: string;
  config?: {
    required?: boolean;
  };
};
export type TinaTextareaField = {
  __typename: "TextareaFormField";
  label: string;
  name: string;
  component: "textarea";
};

const getter = ({ value, field }: { value: string; field: TextareaField }) => {
  return value;
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
  formFieldBuilder: (field: TextareaField): TinaTextareaField => {
    const { ...rest } = field;
    return {
      ...rest,
      component: "textarea",
      __typename: "TextareaFormField",
    };
  },
  dataFieldBuilder: async (datasource, field, value) => {
    return value;
  },
};

export const textarea = {
  getter,
  resolvers,
  builders,
};
