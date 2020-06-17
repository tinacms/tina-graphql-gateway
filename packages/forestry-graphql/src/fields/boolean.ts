import { GraphQLNonNull, GraphQLBoolean } from "graphql";
import { textInput } from "../inputFields";

export type BooleanField = {
  label: string;
  name: string;
  type: "boolean";
  config?: {
    required?: boolean;
  };
};

export const boolean = ({ field }: { fmt: string; field: BooleanField }) => ({
  getter: {
    type: field?.config?.required
      ? GraphQLNonNull(GraphQLBoolean)
      : GraphQLBoolean,
  },
  setter: {
    type: textInput,
    resolve: () => {
      return "hi";
    },
  },
  mutator: {
    type: GraphQLBoolean,
  },
});
