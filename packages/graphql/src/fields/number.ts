import { GraphQLInt, GraphQLNonNull } from "graphql";

import { NumberField } from "../datasources/datasource";
import { textInputType } from "./inputTypes";

export const number = ({ field }: { fmt: string; field: NumberField }) => ({
  getter: {
    // TODO: can be either Int or Float
    type: field?.config?.required ? GraphQLNonNull(GraphQLInt) : GraphQLInt,
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
    type: GraphQLInt,
  },
});
