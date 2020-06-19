import { FieldSourceType, Templates, TemplatePage } from "..";
import {
  GraphQLList,
  GraphQLUnionType,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { getData } from "../util";
import { baseInputFields } from "../inputFields";
import flatten from "lodash.flatten";
import { friendlyName } from "../formatFmt";
import { isSectionListField, isNotNull } from "../utils";

type BaseListField = {
  label: string;
  name: string;
  type: "list";
};
type SimpleList = BaseListField & {
  config: {
    required?: boolean;
    use_select: boolean;
    min: null | number;
    max: null | number;
  };
};
export type SectionList = BaseListField & {
  config?: {
    required?: boolean;
    use_select: boolean;
    min: null | number;
    max: null | number;
    source: {
      type: "pages";
      section: string;
    };
  };
};

export type ListField = SectionList | SimpleList;

export const list = ({
  fmt,
  field,
  rootPath,
  sectionFmts,
  templateObjectTypes,
  templatePages,
}: {
  fmt: string;
  field: ListField;
  rootPath: string;
  sectionFmts: {
    name: string;
    templates: string[];
  }[];
  templateObjectTypes: Templates;
  templatePages: TemplatePage[];
}) => {
  if (isSectionListField(field)) {
    return {
      getter: {
        type: GraphQLList(
          new GraphQLUnionType({
            name: friendlyName(field.name + "_list_" + fmt),
            types: () => {
              const activeSectionTemplates = sectionFmts.find(
                ({ name }) => name === field.config?.source.section
              );
              const types = activeSectionTemplates?.templates
                .map(
                  (templateName: string) => templateObjectTypes[templateName]
                )
                ?.filter(isNotNull) || [
                new GraphQLObjectType({ name: "Woops", fields: {} }), // FIXME fallback to providing a type
              ];

              return types;
            },
            resolveType: async (val) => {
              return templateObjectTypes[val.template];
            },
          })
        ),
        resolve: async (val: FieldSourceType) => {
          let paths = val[field.name];
          paths = Array.isArray(paths) ? paths : [];

          return await Promise.all(
            paths.map(async (itemPath) => {
              const res = await getData<DocumentType>(
                rootPath + "/" + itemPath
              );
              const activeTemplate = templatePages.find(({ pages }) => {
                return pages?.includes(itemPath);
              });
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
            itemField: {
              type: new GraphQLObjectType({
                name: friendlyName(
                  field.name + "_list_" + fmt + "_config_item"
                ),
                fields: {
                  name: { type: GraphQLString },
                  label: { type: GraphQLString },
                  component: { type: GraphQLString },
                  options: { type: GraphQLList(GraphQLString) },
                },
              }),
            },
          },
        }),
        resolve: () => {
          const section = field.config?.source.section;
          const templates = sectionFmts.find(
            (sectionFmt) => sectionFmt.name === section
          )?.templates;
          const possiblePages = flatten(
            templates?.map((templateName) => {
              return templatePages?.find(({ name }) => name === templateName)
                ?.pages;
            })
          );

          return {
            name: field.name,
            label: field.label,
            component: "list",
            itemField: {
              label: field.label + " Item",
              name: "path",
              component: "select",
              options: possiblePages,
            },
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
