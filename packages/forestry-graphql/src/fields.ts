import { GraphQLNonNull, GraphQLString, GraphQLObjectType } from "graphql";
import { textInput } from "./inputFields";

type TextareaField = {
  label: string;
  name: string;
  type: "textarea";
  config: {
    required: boolean;
    wysiwyg: boolean;
    schema: { format: "markdown" };
  };
};

export const textarea = ({ field }: { fmt: string; field: TextareaField }) => ({
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
