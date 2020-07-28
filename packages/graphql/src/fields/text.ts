import { GraphQLNonNull, GraphQLString } from "graphql";

import { TextField } from "../datasources/datasource";
import { textInputType } from "./inputTypes";

export const text = ({ field }: { fmt: string; field: TextField }) => ({
  getter: {
    type: field?.config?.required
      ? GraphQLNonNull(GraphQLString)
      : GraphQLString,
  },
  setter: {
    type: textInputType,
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
