import { BlocksField, FieldType } from "../datasources/datasource";
import { ConfigType, FieldContextType, FieldData } from "./types";
import {
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql";
import {
  arrayToObject,
  friendlyName,
  getBlockFmtTypes,
  shortFMTName,
} from "../util";

import { baseInputFields } from "./inputTypes";

export const blocks = ({
  field,
  config,
  fieldData,
}: {
  field: BlocksField;
  config: ConfigType;
  fieldData: FieldData;
}) => {
  return {
    getter: {
      type: GraphQLList(
        new GraphQLUnionType({
          name: friendlyName(field.name + "_union"),
          types: () => {
            return getBlockFmtTypes(
              field.template_types,
              fieldData.templateDataObjectTypes
            );
          },
          resolveType: (val) => {
            return fieldData.templateDataObjectTypes[val.template];
          },
        })
      ),
    },
    setter: {
      type: getBlocksFieldConfigType(field, fieldData),
      resolve: async (
        _val: { [key: string]: unknown },
        _args: { [argName: string]: any },
        ctx: FieldContextType
      ) => setBlockFieldResolver(field, ctx, config),
    },
    mutator: {
      type: GraphQLList(
        new GraphQLInputObjectType({
          name: friendlyName(field.name + "_input"),
          fields: () => {
            return arrayToObject(field.template_types, (obj, item) => {
              obj[friendlyName(item + "_input")] = {
                type:
                  fieldData.templateDataInputObjectTypes[shortFMTName(item)],
              };
            });
          },
        })
      ),
    },
  };
};

/*
Gets the GraphQL object type that describes a block field. Should generate something that looks like the following:
  BlocksFieldConfig = {
    __typename: String;
    name: String
    label: String;
    description: String;
    component: String;
    templates: BlocksTemplates;
  };
*/
export const getBlocksFieldConfigType = (
  field: BlocksField,
  fieldData: FieldData
): GraphQLObjectType => {
  return new GraphQLObjectType({
    name: friendlyName(field.name + "_fieldConfig"),
    fields: {
      ...baseInputFields,
      templates: {
        type: new GraphQLObjectType({
          name: friendlyName(field.name + "_templates"),
          fields: () => {
            const blockObjectTypes = field.template_types.map(
              (template) => fieldData.templateFormObjectTypes[template]
            );

            return arrayToObject(blockObjectTypes, (obj, item) => {
              obj[item.name] = {
                type: item,
                resolve: (val: unknown) => val,
              };
            });
          },
        }),
      },
    },
  });
};

const setBlockFieldResolver = async (
  field: BlocksField,
  ctx: FieldContextType,
  config: ConfigType
) => {
  return {
    ...field,
    component: field.type,
    templates: Promise.all(
      field.template_types.map(async (templateName) => {
        return ctx.dataSource.getTemplate(
          config.siteLookup,
          templateName + ".yml"
        );
      })
    ),
  };
};
