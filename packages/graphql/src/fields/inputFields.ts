import {
  BooleanField,
  TagListField,
  TextField,
} from "../datasources/datasource";
import { GraphQLObjectType, GraphQLString } from "graphql";

export const baseInputFields = {
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

export const tagInput = new GraphQLObjectType<TagListField>({
  name: "TagsFormField",
  fields: {
    ...baseInputFields,
  },
});
