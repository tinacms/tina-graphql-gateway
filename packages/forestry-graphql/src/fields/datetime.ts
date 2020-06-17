import { GraphQLString } from "graphql";
import { textInput } from "../inputFields";

export type DateField = {
  label: string;
  name: string;
  type: "datetime";
  hidden: boolean;
  default: "now";
  config: {
    date_format: string;
    export_format: string;
    required: boolean;
  };
};

export const datetime = ({
  fmt,
  field,
}: {
  fmt: string;
  field: DateField;
}) => ({
  getter: {
    type: GraphQLString,
  },
  setter: {
    type: textInput,
    resolve: () => {
      return "hi";
    },
  },
  mutator: {
    type: GraphQLString,
  },
});
