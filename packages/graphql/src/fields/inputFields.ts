import {
  BooleanField,
  FileField,
  SelectField,
  TagListField,
  TextField,
} from "../datasources/datasource";
import { GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";

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

export const imageInput = new GraphQLObjectType<FileField>({
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

export const selectInput = new GraphQLObjectType<SelectField>({
  name: "SelectFormField",
  fields: {
    ...baseInputFields,
    options: { type: GraphQLList(GraphQLString) },
  },
});

export const fieldsListInput = new GraphQLObjectType<FieldGroupField>({
  name: friendlyName(field.name + "_fields_list_" + fmt + "_config"),
  fields: {
    label: {
      type: GraphQLString,
    },
    key: {
      type: GraphQLString,
    },
    name: { type: GraphQLString },
    component: {
      type: GraphQLString,
      resolve: () => "group",
    },
    fields: {
      type: GraphQLList(
        new GraphQLUnionType({
          name: friendlyName(
            field.name + "_fields_list_" + fmt + "_config" + "_fields"
          ),
          types: () => {
            const setterValues = Object.values(setters);
            // FIXME:confusing - this is just making sure we only return unique items
            return Array.from(new Set(setterValues.map((item) => item.type)));
          },
          resolveType: (val: FieldType) => {
            const setter = setters[val.name];
            if (!setter) {
              throw new GraphQLError(`No setter defined for field_group value`);
            }
            return setter.type;
          },
        })
      ),
      resolve: async (field, args, context, info) => {
        return Promise.all(
          field.fields.map(async (field) => {
            const setter = setters[field.name];
            if (!setter.resolve) {
              throw new GraphQLError(
                `No resolve function provided for ${field.name}`
              );
            }
            return setter.resolve(field, args, context, info);
          })
        );
      },
    },
  },
});
