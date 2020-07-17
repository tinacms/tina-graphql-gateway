import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { TextField, TextareaField } from "../datasources/datasource";

import { textInput } from "./";

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
