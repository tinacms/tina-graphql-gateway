import { GraphQLString, GraphQLObjectType, GraphQLList } from "graphql";

export const baseInputFields = {
  name: { type: GraphQLString },
  label: { type: GraphQLString },
  value: { type: GraphQLString },
  description: { type: GraphQLString },
  component: { type: GraphQLString },
};

export const textInput = new GraphQLObjectType({
  name: "TextFormField",
  fields: {
    ...baseInputFields,
  },
});

export const selectInput = new GraphQLObjectType({
  name: "SelectFormField",
  fields: {
    ...baseInputFields,
    options: { type: GraphQLList(GraphQLString) },
  },
});

export const imageInput = new GraphQLObjectType({
  name: "ImageFormField",
  fields: {
    ...baseInputFields,
  },
});

export const tagInput = new GraphQLObjectType({
  name: "TagsFormField",
  fields: {
    ...baseInputFields,
    value: { type: GraphQLList(GraphQLString) },
  },
});
