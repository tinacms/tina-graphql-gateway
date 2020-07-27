import { DateField, TextField } from "../datasources/datasource";
import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";

import { baseInputFields } from "./inputTypes";

export const datetime = ({
  fmt,
  field,
}: {
  fmt: string;
  field: DateField;
}) => ({
  getter: {
    type: field?.config?.required
      ? GraphQLNonNull(GraphQLString)
      : GraphQLString,
  },
  setter: {
    type: new GraphQLObjectType<TextField>({
      name: "DateFormField",
      fields: {
        ...baseInputFields,
        dateFormat: { type: GraphQLString },
        timeFormat: { type: GraphQLBoolean }, // FIXME: Forestry outputs boolean | "some time"
      },
    }),
    resolve: () => {
      return {
        name: field.name,
        label: field.label,
        component: "date",
        dateFormat: "MMMM DD YYYY",
        timeFormat: false,
      };
    },
  },
  mutator: {
    type: GraphQLString,
  },
});
