import { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType } from "graphql";

import { BooleanField } from "../datasources/datasource";
import { baseInputFields } from "./inputTypes";

export const boolean = ({ field }: { fmt: string; field: BooleanField }) => ({
  getter: {
    type: field?.config?.required
      ? GraphQLNonNull(GraphQLBoolean)
      : GraphQLBoolean,
  },
  setter: {
    type: booleanInputType,
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

export const booleanInputType = new GraphQLObjectType<BooleanField>({
  name: "BooleanFormField",
  fields: {
    ...baseInputFields,
  },
});
