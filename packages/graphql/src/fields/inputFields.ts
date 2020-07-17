import { BooleanField, TextField } from "../datasources/datasource";
import { GraphQLObjectType, GraphQLString } from "graphql";

const baseInputFields = {
  name: { type: GraphQLString },
  label: { type: GraphQLString },
  description: { type: GraphQLString },
  component: { type: GraphQLString },
};

export const textInput = new GraphQLObjectType<TextField>({
  name: "TextFormField",
  fields: {
    ...baseInputFields,
  },
});

export const booleanInput = new GraphQLObjectType<BooleanField>({
  name: "BooleanFormField",
  fields: {
    ...baseInputFields,
  },
});
