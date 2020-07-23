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

import { BlocksField } from "../datasources/datasource";
import { FieldContextType } from "./types";
import { baseInputFields } from ".";

export const blocks = ({
  fmt,
  field,
  config,
  fieldData,
}: {
  fmt: string;
  field: BlocksField;
  config: { rootPath: string; siteLookup: string };
  fieldData: {
    sectionFmts: any;
    templateObjectTypes: any;
    templatePages: any;
    templateDataObjectTypes: any;
    templateFormObjectTypes: any;
    templateDataInputObjectTypes: any;
  };
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
      type: new GraphQLObjectType({
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
      }),
      resolve: async (val: any, _args: any, ctx: FieldContextType) => {
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
      },
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
