import { ConfigType, FieldData } from "./types";
import type { GenerateFieldAccessorsFunction } from "../fieldGenerator";
import { FieldGroupListField, FieldType } from "../datasources/datasource";
import {
  GraphQLError,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql";

import { friendlyFMTName } from "@forestryio/graphql-helpers";

export const field_group_list = ({
  fmt,
  field,
  config,
  fieldData,
  generateFieldAccessors,
}: {
  fmt: string;
  field: FieldGroupListField;
  config: ConfigType;
  fieldData: FieldData;
  generateFieldAccessors: GenerateFieldAccessorsFunction;
}) => {
  const { getters, setters, mutators } = generateFieldAccessors({
    fmt: `${fmt}_${field.name}`,
    fields: field.fields,
    config,
    fieldData,
  });

  const fieldGroupListInput = new GraphQLObjectType<FieldGroupListField>({
    name: friendlyFMTName(field.name + "_fields_list_" + fmt + "_config"),
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
        resolve: () => "group-list",
      },
      fields: {
        type: GraphQLList(
          new GraphQLUnionType({
            name: friendlyFMTName(
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
                  `No setter defined for field_group_list value`
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
      type: GraphQLList(
        new GraphQLObjectType({
          name: friendlyFMTName(field.name + "_fields_list_" + fmt),
          fields: getters,
        })
      ),
    },
    setter: {
      type: fieldGroupListInput,
      resolve: (val: any) => val,
    },
    mutator: {
      type: GraphQLList(
        new GraphQLInputObjectType({
          name: friendlyFMTName(field.name + "_fields_list_" + fmt + "_input"),
          fields: mutators,
        })
      ),
    },
  };
};
