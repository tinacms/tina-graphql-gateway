import { GraphQLNonNull, GraphQLInt } from "graphql";
import { textInput } from "../inputFields";

export type NumberField = {
  label: string;
  name: string;
  type: "number";
  config?: {
    required?: boolean;
  };
};

export const number = ({ field }: { fmt: string; field: NumberField }) => ({
  getter: {
    // TODO: can be either Int or Float
    type: field?.config?.required ? GraphQLNonNull(GraphQLInt) : GraphQLInt,
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
    type: GraphQLInt,
  },
});
