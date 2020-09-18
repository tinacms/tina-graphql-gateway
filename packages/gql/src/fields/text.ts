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

const builder = ({ field }: { field: TextField }) => {
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
  builder,
};
