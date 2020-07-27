import { FileField, TextField } from "../datasources/datasource";
import { GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";

export const baseInputFields = {
  name: { type: GraphQLString },
  label: { type: GraphQLString },
  description: { type: GraphQLString },
  component: { type: GraphQLString },
};

export const textInputType = new GraphQLObjectType<TextField>({
  name: "TextFormField",
  fields: {
    ...baseInputFields,
  },
});

export const imageInputType = new GraphQLObjectType<FileField>({
  name: "ImageFormField",
  fields: {
    ...baseInputFields,
    fields: {
      type: GraphQLList(
        new GraphQLObjectType({
          name: "ImageWrapInner",
          fields: {
            name: { type: GraphQLString },
            label: { type: GraphQLString },
            component: { type: GraphQLString },
          },
        })
      ),
    },
  },
});
