import { pluginsList } from "../plugins";
import {
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql";
import { selectInput } from "../inputFields";
import { getData } from "../util";
import flatten from "lodash.flatten";
import {
  Templates,
  TemplatePage,
  isSectionSelectField,
  FieldSourceType,
  isNotNull,
} from "..";
import { friendlyName } from "../formatFmt";

type BaseSelectField = {
  label: string;
  name: string;
  type: "select";
};
export type SectionSelect = BaseSelectField & {
  config: {
    required: boolean;
    source: {
      type: "pages";
      section: string;
      file: string;
      path: string;
    };
  };
};
type SimpleSelect = BaseSelectField & {
  default: string;
  config: {
    options: string[];
    required: boolean;
    source: {
      type: "simple";
    };
  };
};

export type SelectField = SectionSelect | SimpleSelect;

export const select = ({
  fmt,
  field,
  rootPath,
  sectionFmts,
  templateObjectTypes,
  templatePages,
}: {
  fmt: string;
  field: SelectField;
  rootPath: string;
  sectionFmts: {
    name: string;
    templates: string[];
  }[];
  templateObjectTypes: Templates;
  templatePages: TemplatePage[];
}) => {
  if (pluginsList.matches("select", field)) {
    return {
      getter: pluginsList.run("select", {
        fmt,
        rootPath: rootPath,
        field,
        templates: templateObjectTypes,
        sectionFmts,
        templatePages,
      }),
      setter: {
        type: selectInput,
        resolve: (value: any) => {
          return {
            name: field.name,
            label: field.label,
            component: "select",
            options: value?.config?.options || [],
          };
        },
      },
      mutator: {
        type: GraphQLString,
      },
    };
  } else {
    if (isSectionSelectField(field)) {
      return {
        getter: {
          type: new GraphQLUnionType({
            name: friendlyName(field.name + "_select_" + fmt),
            types: () => {
              const activeSectionTemplates = sectionFmts.find(
                ({ name }) => name === field.config.source.section
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
          }),
          resolve: async (val: FieldSourceType) => {
            const path = val[field.name];
            if (isString(path)) {
              const res = await getData<DocumentType>(rootPath + "/" + path);
              const activeTemplate = templatePages.find(({ pages }) => {
                return pages?.includes(path);
              });
              return {
                ...res,
                path: val[field.name],
                template: activeTemplate?.name,
              };
            } else {
              return {};
            }
          },
        },
        setter: {
          type: selectInput,
          resolve: () => {
            if (field?.config?.source?.type === "pages") {
              const activeSectionTemplates = sectionFmts?.find(
                ({ name }) => name === field.config.source.section
              )?.templates;
              const options = flatten(
                activeSectionTemplates?.map((templateSlug) => {
                  return templatePages?.find(
                    ({ name }) => name === templateSlug
                  )?.pages;
                })
              );

              return {
                ...field,
                component: "select",
                options,
              };
            }

            return {
              name: field.name,
              label: field.label,
              component: "select",
              options: ["this shouldn", "be seen"],
            };
          },
        },
        mutator: {
          type: GraphQLString,
        },
      };
    }

    const options: { [key: string]: { value: string } } = {};
    field.config?.options.forEach(
      (option) => (options[option] = { value: option })
    );

    return {
      getter: {
        // type: new GraphQLEnumType({
        //   name: friendlyName(field.name + "_select_" + fmt),
        //   values: options,
        // }),
        type: GraphQLString,
        resolve: (value: any) => {
          return value[field.name] || field.default;
        },
      },
      setter: {
        type: selectInput,
        resolve: () => {
          return {
            name: field.name,
            label: field.label,
            component: "select",
            options: field.config.options,
          };
        },
      },
      mutator: {
        type: new GraphQLEnumType({
          name: friendlyName(field.name + "_select_" + fmt),
          values: options,
        }),
      },
    };
  }
};

function isString(arg: string | string[]): arg is string {
  return typeof arg === "string";
}
