import { GraphQLNonNull, GraphQLString, GraphQLObjectType } from "graphql";
import { textInput } from "../inputFields";

export type TextField = {
  label: string;
  name: string;
  type: "text";
  default: string;
  config?: {
    required?: boolean;
  };
};

export const text = ({ field }: { fmt: string; field: TextField }) => ({
  getter: {
    type: field?.config?.required
      ? GraphQLNonNull(GraphQLString)
      : GraphQLString,
  },
  setter: {
    type: textInput,
    resolve: () => {
      return {
        name: field.name,
        label: field.label,
        component: field.type,
      };
    },
  },
  mutator: {
    type: GraphQLString,
  },
});
