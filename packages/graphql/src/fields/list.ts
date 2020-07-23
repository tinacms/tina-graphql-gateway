import {
  ConfigType,
  DocumentType,
  FieldContextType,
  FieldData,
  FieldSourceType,
} from "../fields/types";
import {
  GraphQLError,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql";
import {
  friendlyName,
  getFmtForDocument,
  getPagesForSection,
  getSectionFmtTypes2,
  isDocumentListField,
  isListValue,
  isSectionListField,
  isString,
} from "../util";

import { ListField } from "../datasources/datasource";
import { baseInputFields } from "./inputTypes";

export const list = ({
  fmt,
  field,
  config,
  fieldData,
}: {
  fmt: string;
  field: ListField;
  config: ConfigType;
  fieldData: FieldData;
}) => {
  if (isDocumentListField(field)) {
    return {
      getter: {
        type: GraphQLList(
          new GraphQLObjectType({
            name: friendlyName(field.name + "_list_" + fmt + "_item"),
            fields: {
              path: { type: GraphQLString },
            },
          })
        ),
        resolve: async (val: any) => {
          return val[field.name].map((item: any) => {
            return { path: item };
          });
        },
      },
      setter: {
        type: new GraphQLObjectType({
          name: friendlyName(field.name + "_list_" + fmt + "_config"),
          fields: {
            ...baseInputFields,
            component: { type: GraphQLString },
            fields: {
              type: GraphQLList(
                new GraphQLObjectType({
                  name: friendlyName(
                    field.name + "_list_" + fmt + "_config_item"
                  ),
                  fields: {
                    name: { type: GraphQLString },
                    label: { type: GraphQLString },
                    component: { type: GraphQLString },
                    options: { type: GraphQLList(GraphQLString) },
                  },
                })
              ),
            },
          },
        }),
        resolve: async (
          val: FieldSourceType,
          _args: { [argName: string]: any },
          ctx: FieldContextType
        ) => {
          const filepath = field.config?.source.file;
          if (!filepath) {
            throw new GraphQLError(
              `No path specificied for list field ${field.name}
                `
            );
          }
          const keyPath = field.config?.source.path;
          if (!keyPath) {
            throw new GraphQLError(
              `No path specificied key for list field document ${field.name}
                `
            );
          }
          const res = await ctx.dataSource.getData<any>("", filepath);
          return {
            name: field.name,
            label: field.label,
            component: "group-list",
            fields: [
              {
                label: field.label + " Item",
                name: "path",
                component: "select",
                options: Object.keys(res.data[keyPath]),
              },
            ],
          };
        },
      },
      mutator: {
        type: GraphQLList(GraphQLString),
      },
    };
  }
  if (isSectionListField(field)) {
    return {
      getter: {
        type: GraphQLList(
          new GraphQLUnionType({
            name: friendlyName(field.name + "_list_" + fmt),
            types: () => {
              return getSectionFmtTypes2(
                field.config?.source.section || "",
                fieldData.sectionFmts,
                fieldData.templateObjectTypes
              );
            },
            resolveType: async (val: DocumentType) => {
              return fieldData.templateObjectTypes[val.template];
            },
          })
        ),
        resolve: async (
          val: FieldSourceType,
          _args: { [argName: string]: any },
          ctx: FieldContextType
        ) => {
          if (!isListValue(val)) {
            throw new GraphQLError("is not");
          }

          let paths = val[field.name];
          paths = Array.isArray(paths) ? paths : [];

          return await Promise.all(
            paths.map(async (itemPath: unknown) => {
              if (!isString(itemPath)) {
                throw new GraphQLError(
                  `Expected string for list resolver but got ${typeof itemPath}`
                );
              }
              const res = await ctx.dataSource.getData<DocumentType>(
                config.siteLookup,
                itemPath
              );
              const activeTemplate = getFmtForDocument(
                itemPath,
                fieldData.templatePages
              );
              return {
                ...res,
                path: itemPath,
                template: activeTemplate?.name,
              };
            })
          );
        },
      },
      setter: {
        type: new GraphQLObjectType({
          name: friendlyName(field.name + "_list_" + fmt + "_config"),
          fields: {
            ...baseInputFields,
            component: { type: GraphQLString },
            fields: {
              type: GraphQLList(
                new GraphQLObjectType({
                  name: friendlyName(
                    field.name + "_list_" + fmt + "_config_item"
                  ),
                  fields: {
                    name: { type: GraphQLString },
                    label: { type: GraphQLString },
                    component: { type: GraphQLString },
                    options: { type: GraphQLList(GraphQLString) },
                  },
                })
              ),
            },
          },
        }),
        resolve: () => {
          const possiblePages = getPagesForSection(
            field.config?.source.section || "",
            fieldData.sectionFmts,
            fieldData.templatePages
          );

          return {
            name: field.name,
            label: field.label,
            component: "group-list",
            fields: [
              {
                label: field.label + " Item",
                name: "path",
                component: "select",
                options: possiblePages,
              },
            ],
          };
        },
      },
      mutator: {
        type: GraphQLList(GraphQLString),
      },
    };
  }

  return {
    getter: { type: GraphQLList(GraphQLString) },
    setter: {
      type: new GraphQLObjectType({
        name: friendlyName(field.name + "_list_" + fmt + "_config"),
        fields: {
          ...baseInputFields,
          component: { type: GraphQLString },
          itemField: {
            type: new GraphQLObjectType({
              name: friendlyName(field.name + "_list_" + fmt + "_config_item"),
              fields: {
                name: { type: GraphQLString },
                label: { type: GraphQLString },
                component: { type: GraphQLString },
              },
            }),
          },
        },
      }),
      resolve: () => {
        return {
          name: field.name,
          label: field.label,
          component: "list",
          itemField: {
            label: field.label + " Item",
            component: "text",
          },
        };
      },
    },
    mutator: {
      type: GraphQLList(GraphQLString),
    },
  };
};
