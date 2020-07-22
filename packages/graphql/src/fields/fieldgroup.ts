import { FieldData, configType } from "./types";
import { FieldGroupField, FieldType } from "../datasources/datasource";
import {
  GraphQLError,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql";

import { friendlyName } from "../util";
import { generateFieldAccessors } from "../fieldGenerator";

export const field_group = ({
  fmt,
  field,
  config,
  fieldData,
}: {
  fmt: string;
  field: FieldGroupField;
  config: configType;
  fieldData: FieldData;
}) => {
  const { getters, setters, mutators } = generateFieldAccessors({
    fmt: `${fmt}_${field.name}`,
    fields: field.fields,
    config,
    fieldData,
  });

  const fieldsListInput = new GraphQLObjectType<FieldGroupField>({
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
                throw new GraphQLError(
                  `No setter defined for field_group value`
                );
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

  return {
    getter: {
      type: new GraphQLObjectType({
        name: friendlyName(field.name + "_fields_" + fmt),
        fields: getters,
      }),
    },
    setter: {
      type: fieldsListInput,
      resolve: () => field,
    },
    mutator: {
      type: new GraphQLInputObjectType({
        name: friendlyName(field.name + "_fields_" + fmt + "_input"),
        fields: mutators,
      }),
    },
  };
};
