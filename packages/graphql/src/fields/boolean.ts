import { GraphQLBoolean, GraphQLNonNull } from "graphql";

import { BooleanField } from "../datasources/datasource";
import { booleanInput } from "./inputFields";

export const boolean = ({ field }: { fmt: string; field: BooleanField }) => ({
  getter: {
    type: field?.config?.required
      ? GraphQLNonNull(GraphQLBoolean)
      : GraphQLBoolean,
  },
  setter: {
    type: booleanInput,
    resolve: () => {
      return {
        name: field.name,
        label: field.label,
        component: "toggle",
      };
    },
  },
  mutator: {
    type: GraphQLBoolean,
  },
});
