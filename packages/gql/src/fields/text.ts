import { GraphQLString, GraphQLObjectType } from "graphql";

export type TextField = {
  label: string;
  name: string;
  type: "text";
  default: string;
  config?: {
    required?: boolean;
  };
};

const getter = ({ value, field }: { value: string; field: TextField }) => {
  return value;
};
const builder = ({ field }: { field: TextField }) => {
  console.log(field);
  return {
    name: { type: GraphQLString },
    label: { type: GraphQLString },
    type: { type: GraphQLString },
    config: {
      type: new GraphQLObjectType({
        name: "Config",
        fields: { required: { type: GraphQLString } },
      }),
    },
  };
};

export const text = {
  getter,
  builder,
};
