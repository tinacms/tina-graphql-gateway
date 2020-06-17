import { getData, getDirectoryList } from "./util";
import fs from "fs";
import path from "path";
import flatten from "lodash.flatten";
import express from "express";
import graphqlHTTP from "express-graphql";
import cors from "cors";
import { codegen } from "@graphql-codegen/core";
import { plugin as typescriptPlugin } from "@graphql-codegen/typescript";
import { plugin as typescriptOperationsPlugin } from "@graphql-codegen/typescript-operations";
import {
  parse,
  getNamedType,
  GraphQLBoolean,
  GraphQLError,
  GraphQLInputType,
  GraphQLEnumType,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLUnionType,
  GraphQLNonNull,
  printSchema,
  GraphQLType,
  GraphQLFieldConfig,
  GraphQLInputObjectType,
  GraphQLFieldResolver,
} from "graphql";
import camelCase from "lodash.camelcase";
import upperFist from "lodash.upperfirst";
import { pluginsList } from "./plugins";
import {
  baseInputFields,
  textInput,
  selectInput,
  tagInput,
  imageInput,
} from "./inputFields";
import { textarea, TextareaField } from "./fields/textarea";
import { TextField, text } from "./fields/text";
import { NumberField, number } from "./fields/number";
import { DateField, datetime } from "./fields/datetime";
import { BooleanField, boolean } from "./fields/boolean";
import { FileField, file } from "./fields/file";
import { TagListField, tag_list } from "./fields/tagList";
import { image_gallery, GalleryField } from "./fields/imageGallery";

type DirectorySection = {
  type: "directory";
  label: string;
  path: string;
  create: "documents" | "all";
  match: string;
  new_doc_ext: string;
  templates: string[];
};
type HeadingSection = {
  type: "heading";
  label: string;
};
type DocumentSection = {
  type: "document";
  label: string;
  path: string;
};
type Section = DirectorySection | HeadingSection | DocumentSection;
type Settings = {
  data: { sections: Section[] };
};

function isDirectorySection(section: Section): section is DirectorySection {
  return section.type === "directory";
}

function isSelectField(field: FieldType): field is SelectField {
  return field.type === "select";
}
function isSectionSelectField(field: FieldType): field is SectionSelect {
  if (!isSelectField(field)) {
    return false;
  }
  return field?.config?.source?.type === "pages";
}

function isListField(field: FieldType): field is SelectField {
  return field.type === "list";
}
function isNotNull<T>(arg: T): arg is Exclude<T, null> {
  return arg !== null;
}
function isString(arg: string | string[]): arg is string {
  return typeof arg === "string";
}

function isSectionListField(field: FieldType): field is SectionList {
  if (!isListField(field)) {
    return false;
  }
  return field?.config?.source?.type === "pages";
}

type BaseDocumentType = {
  content: string;
  isEmpty: boolean;
  excerpt: string;
};

type DocumentType = BaseDocumentType & {
  path: string;
  template: string;
  data: object;
};
type WithFields = {
  label: string;
  name: string;
  type: string;
  fields: FieldType[];
};
type FMT = BaseDocumentType & {
  data: WithFields & {
    label: string;
    hide_body: boolean;
    display_field: string;
    pages: string[];
  };
};

type BlocksField = {
  label: string;
  name: string;
  type: "blocks";
  template_types: string[];
  config?: {
    min: string;
    max: string;
  };
};
type FieldGroupField = WithFields & {
  label: string;
  name: string;
  type: "field_group";
  config?: {
    required?: boolean;
  };
};
type FieldGroupListField = WithFields & {
  label: string;
  name: string;
  type: "field_group_list";
  config?: {
    required?: boolean;
  };
};

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
type SectionList = BaseListField & {
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
type ListField = SectionList | SimpleList;

type BaseSelectField = {
  label: string;
  name: string;
  type: "select";
};
type SectionSelect = BaseSelectField & {
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
type SelectField = SectionSelect | SimpleSelect;
type FieldType =
  | TextField
  | TextareaField
  | BlocksField
  | DateField
  | NumberField
  | BooleanField
  | TagListField
  | SelectField
  | ListField
  | GalleryField
  | FileField
  | FieldGroupField
  | FieldGroupListField;

type TemplatePage = { name: string; pages: string[] };

type Templates = {
  [key: string]: null | GraphQLObjectType;
};
type TemplatesData = { [key: string]: GraphQLObjectType };

export type PluginFieldArgs = {
  fmt: string;
  field: FieldType;
  templatePages: TemplatePage[];
  templates: Templates;
  rootPath: string;
  sectionFmts: {
    name: string;
    templates: string[];
  }[];
};

type FieldSourceType = {
  [key: string]: string | string[];
};
type FieldContextType = {};
export type Plugin = {
  matches: (string: FieldType["type"], field: FieldType) => boolean;
  run: (
    string: FieldType["type"],
    stuff: PluginFieldArgs
  ) => GraphQLFieldConfig<FieldSourceType, FieldContextType>;
};

/**
 * this function is used to help recursively set the `setter` for groups.
 * it currently treats groups and group-lists similarly which should be fixed
 */
const buildGroupSetter = ({
  name,
  setters,
  field,
}: {
  name: string;
  setters: {
    [key: string]: GraphQLFieldConfig<
      FieldSourceType,
      FieldContextType,
      {
        [argName: string]: GraphQLType;
      }
    >;
  };
  field: WithFields;
}) => {
  const array = Object.values(setters);
  const types = Array.from(new Set(array.map((item: any) => item.type)));
  return new GraphQLObjectType({
    name: name,
    fields: {
      label: {
        type: GraphQLString,
        resolve: () => {
          return field.label;
        },
      },
      key: {
        type: GraphQLString,
        resolve: () => {
          return camelCase(field.label);
        },
      },
      name: { type: GraphQLString, resolve: () => field.name },
      component: {
        type: GraphQLString,
        resolve: () => {
          return field.type === "field_group_list" ? "group-list" : "group";
        },
      },
      fields: {
        type: GraphQLList(
          new GraphQLUnionType({
            name: name + "_component_config",
            types,
            // @ts-ignore
            resolveType: (val) => {
              return setters[val.name]?.type || types[0];
            },
          })
        ),
        resolve: async (source, args, context, info) => {
          return Promise.all(
            field.fields.map(async (field) => {
              // FIXME: calling resolve manually here, probably a sign that this is in the wrong place
              const res = setters[field.name];
              // @ts-ignore
              return res?.resolve(field, args, context, info);
            })
          );
        },
      },
    },
  });
};

/**
 * This is the main function in this script, it returns all the types
 */
const buildSchema = async (config: any) => {
  const FMT_BASE = ".forestry/front_matter/templates";
  const SETTINGS_PATH = "/.forestry/settings.yml";
  const PATH_TO_TEMPLATES = config.rootPath + "/" + FMT_BASE;

  const shortFMTName = (path: string) => {
    return path.replace(`${PATH_TO_TEMPLATES}/`, "").replace(".yml", "");
  };
  const friendlyName = (name: string, options = { suffix: "" }) => {
    const delimiter = "_";

    return upperFist(
      camelCase(
        shortFMTName(name) + (options.suffix && delimiter + options.suffix)
      )
    );
  };
  const friendlyFMTName = (path: string, options = { suffix: "" }) => {
    const delimiter = "_";

    return upperFist(
      camelCase(
        shortFMTName(path) + (options.suffix && delimiter + options.suffix)
      )
    );
  };

  const arrayToObject = <T>(
    array: T[],
    func: (accumulator: { [key: string]: any }, item: T) => void
  ) => {
    const accumulator = {};
    array.forEach((item) => {
      func(accumulator, item);
    });

    return accumulator;
  };

  const replaceFMTPathWithSlug = (path: string) => {
    // FIXME: we reference the slug in "select" fields
    return path.replace(config.sectionPrefix, "");
  };
  const settings = await getData<Settings>(config.rootPath + SETTINGS_PATH);

  const fmtList = await getDirectoryList(PATH_TO_TEMPLATES);

  const templateInputObjectTypes: {
    [key: string]: GraphQLInputObjectType;
  } = {};
  const templateFormObjectTypes: { [key: string]: GraphQLObjectType } = {};
  const templateDataObjectTypes: TemplatesData = {};
  const templateObjectTypes: Templates = {};

  fmtList.forEach((path) => {
    templateObjectTypes[shortFMTName(path)] = null;
  });

  const templatePages = await Promise.all(
    fmtList.map(async (fmt) => {
      return {
        name: shortFMTName(fmt),
        pages: (await getData<FMT>(fmt)).data.pages,
      };
    })
  );

  const sectionFmts = settings.data.sections
    .filter(isDirectorySection)
    .map(({ path, templates }) => ({
      name: replaceFMTPathWithSlug(path),
      templates,
    }));

  const select = ({ fmt, field }: { fmt: string; field: SelectField }) => {
    if (pluginsList.matches("select", field)) {
      return {
        getter: pluginsList.run("select", {
          fmt,
          rootPath: config.rootPath,
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
                const res = await getData<DocumentType>(
                  config.rootPath + "/" + path
                );
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

  const list = ({ fmt, field }: { fmt: string; field: ListField }) => {
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
                  config.rootPath + "/" + itemPath
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
                name: friendlyName(
                  field.name + "_list_" + fmt + "_config_item"
                ),
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

  const field_group = ({
    fmt,
    field,
  }: {
    fmt: string;
    field: FieldGroupField;
  }) => {
    const { getters, setters, mutators } = generateFields({
      fmt: `${fmt}_${field.name}`,
      fields: field.fields,
    });
    return {
      getter: {
        type: new GraphQLObjectType({
          name: friendlyName(field.name + "_fields_" + fmt),
          fields: getters,
        }),
      },
      setter: {
        type: buildGroupSetter({
          name: friendlyName(field.name + "_fields_list_" + fmt + "_config"),
          setters: setters,
          field,
        }),
        resolve: (value: any) => {
          return value;
        },
      },
      mutator: {
        type: new GraphQLInputObjectType({
          name: friendlyName(field.name + "_fields_" + fmt + "_input"),
          fields: mutators,
        }),
      },
    };
  };
  const field_group_list = ({
    fmt,
    field,
  }: {
    fmt: string;
    field: FieldGroupListField;
  }) => {
    const { getters, setters, mutators } = generateFields({
      fmt: `${fmt}_${field.name}`,
      fields: field.fields,
    });
    return {
      getter: {
        type: GraphQLList(
          new GraphQLObjectType({
            name: friendlyName(field.name + "_fields_list_" + fmt),
            fields: getters,
          })
        ),
      },
      setter: {
        type: buildGroupSetter({
          name: friendlyName(field.name + "_fields_list_" + fmt + "_config"),
          setters,
          field,
        }),
        resolve: (value: any) => {
          return value;
        },
      },
      mutator: {
        type: GraphQLList(
          new GraphQLInputObjectType({
            name: friendlyName(field.name + "_fields_list_" + fmt + "_input"),
            fields: mutators,
          })
        ),
      },
    };
  };
  const blocks = ({ field }: { fmt: string; field: BlocksField }) => {
    return {
      getter: {
        type: GraphQLList(
          new GraphQLUnionType({
            name: friendlyName(field.name + "_union"),
            types: () => {
              return field.template_types.map(
                (template) => templateDataObjectTypes[template]
              );
            },
            resolveType: (val) => {
              return templateDataObjectTypes[val.template];
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
                  return arrayToObject(
                    field.template_types.map(
                      (template) => templateFormObjectTypes[template]
                    ),
                    (obj, item) => {
                      obj[item.name] = {
                        type: item,
                        resolve: (val: any) => val,
                      };
                    }
                  );
                },
              }),
            },
          },
        }),
        resolve: async (value: { [key: string]: {} }) => {
          return {
            ...field,
            value: value[field.name],
            component: field.type,
            templates: arrayToObject(field.template_types, (obj, item) => {
              obj[item] = { name: item };
            }),
          };
        },
      },
      mutator: {
        type: GraphQLList(
          new GraphQLInputObjectType({
            name: friendlyName(field.name + "_input"),
            fields: () => {
              return arrayToObject(field.template_types, (obj, item) => {
                obj[friendlyName(item) + "_input"] = {
                  type: templateInputObjectTypes[shortFMTName(item)],
                };
              });
            },
          })
        ),
      },
    };
  };

  const getFieldType = ({
    fmt,
    field,
  }: {
    fmt: string;
    field: FieldType;
  }): {
    getter: GraphQLFieldConfig<
      FieldSourceType,
      FieldContextType,
      {
        [argName: string]: GraphQLType;
      }
    >;
    setter: GraphQLFieldConfig<
      FieldSourceType,
      FieldContextType,
      {
        [argName: string]: GraphQLType;
      }
    >;
    mutator: { type: GraphQLInputType };
  } => {
    switch (field.type) {
      case "text":
        return text({ fmt, field });
      case "textarea":
        return textarea({ fmt, field });
      case "number":
        return number({ fmt, field });
      case "boolean":
        return boolean({ fmt, field });
      case "select":
        return select({ fmt, field });
      case "datetime":
        return datetime({ fmt, field });
      case "tag_list":
        return tag_list({ fmt, field });
      case "list":
        return list({ fmt, field });
      case "file":
        return file({ fmt, field, rootPath: config.rootPath });
      case "image_gallery":
        return image_gallery({ fmt, field, rootPath: config.rootPath });
      case "field_group":
        return field_group({ fmt, field });
      case "field_group_list":
        return field_group_list({ fmt, field });
      case "blocks":
        return blocks({ fmt, field });
      default:
        // FIXME just a placeholder
        return text({ fmt, field });
    }
  };

  const generateFields = ({
    fmt,
    fields,
  }: {
    fmt: string;
    fields: FieldType[];
  }) => {
    const accumulator: {
      getters: {
        [key: string]: GraphQLFieldConfig<
          FieldSourceType,
          FieldContextType,
          {
            [argName: string]: GraphQLType;
          }
        >;
      };
      setters: {
        [key: string]: GraphQLFieldConfig<
          FieldSourceType,
          FieldContextType,
          {
            [argName: string]: GraphQLType;
          }
        >;
      };
      mutators: {
        [key: string]: { type: GraphQLInputType };
      };
    } = { getters: {}, setters: {}, mutators: {} };

    fields.forEach((field) => {
      const { getter, setter, mutator } = getFieldType({ fmt, field });
      accumulator.getters[field.name] = getter;
      accumulator.setters[field.name] = setter;
      accumulator.mutators[field.name] = mutator;
    });

    return {
      getters: accumulator.getters,
      setters: accumulator.setters,
      mutators: accumulator.mutators,
    };
  };

  await Promise.all(
    fmtList.map(async (path) => {
      const fmt = await getData<FMT>(path);

      const { getters, setters, mutators } = generateFields({
        fmt: friendlyFMTName(path),
        fields: fmt.data.fields,
      });

      const templateInputObjectType = new GraphQLInputObjectType({
        name: friendlyFMTName(path) + "_input",
        fields: mutators,
      });

      const templateFormObjectType = buildGroupSetter({
        name: friendlyFMTName(path, { suffix: "field_config" }),
        setters,
        field: fmt.data,
      });

      const templateDataObjectType = new GraphQLObjectType({
        name: friendlyFMTName(path, { suffix: "data" }),
        fields: {
          _template: {
            type: GraphQLString,
            resolve: () => friendlyFMTName(path, { suffix: "field_config" }),
          },
          ...getters,
        },
      });

      const templateObjectType = new GraphQLObjectType({
        name: friendlyFMTName(path),
        fields: {
          form: {
            type: templateFormObjectType,
            resolve: (value) => {
              return value;
            },
          },
          absolutePath: { type: GraphQLNonNull(GraphQLString) },
          path: { type: GraphQLNonNull(GraphQLString) },
          content: {
            type: GraphQLNonNull(GraphQLString),
          },
          excerpt: { type: GraphQLString },
          data: { type: GraphQLNonNull(templateDataObjectType) },
        },
      });

      templateInputObjectTypes[shortFMTName(path)] = templateInputObjectType;
      templateFormObjectTypes[shortFMTName(path)] = templateFormObjectType;
      templateDataObjectTypes[shortFMTName(path)] = templateDataObjectType;
      templateObjectTypes[shortFMTName(path)] = templateObjectType;
    })
  );

  const documentType = new GraphQLUnionType({
    name: friendlyName("document_union"),
    types: () => {
      const sectionTemplates = flatten(
        settings.data.sections
          .filter(isDirectorySection)
          .map(({ templates }) => templates)
      );
      const types = sectionTemplates
        .map((sectionTemplate) => templateObjectTypes[sectionTemplate])
        ?.filter(isNotNull) || [
        new GraphQLObjectType({ name: "Woops", fields: {} }), // FIXME fallback to providing a type
      ];

      return types;
    },
    resolveType: (val) => {
      return templateObjectTypes[val.template];
    },
  });

  const documentInputType = {
    type: new GraphQLInputObjectType({
      name: "DocumentInput",
      fields: () => {
        const sectionTemplates = flatten(
          settings.data.sections
            .filter(isDirectorySection)
            .map(({ templates }) => templates)
        );

        return arrayToObject<GraphQLInputObjectType>(
          sectionTemplates
            .map((sectionTemplate) => templateInputObjectTypes[sectionTemplate])
            ?.filter(isNotNull),
          (obj, item) => {
            obj[getNamedType(item).toString()] = { type: item };
          }
        );
      },
    }),
  };

  const rootQuery = new GraphQLObjectType({
    name: "Query",
    fields: {
      document: {
        type: documentType,
        args: {
          path: { type: GraphQLNonNull(GraphQLString) },
        },
        resolve: async (_, args): Promise<DocumentType> => {
          const activeTemplate = templatePages.find(({ pages }) => {
            return pages?.includes(args.path);
          });

          const document = await getData<DocumentType>(
            config.rootPath + "/" + args.path
          );

          return {
            ...document,
            path: args.path,
            template: activeTemplate?.name || "",
          };
        },
      },
    },
  });
  const rootMutation = new GraphQLObjectType({
    name: "Mutation",
    fields: {
      document: {
        type: documentType,
        args: {
          path: { type: GraphQLNonNull(GraphQLString) },
          params: documentInputType,
        },
      },
    },
  });

  const schema = new GraphQLSchema({
    query: rootQuery,
    mutation: rootMutation,
  });

  const documentMutation = (payload: any) => {
    console.log("mutation:", JSON.stringify(payload, null, 2));
  };

  return { schema, documentMutation };
};

const app = express();
app.use(cors());
app.use(
  "/graphql",
  graphqlHTTP(async () => {
    const configPath = path.resolve(process.cwd() + "/.forestry/config.js");
    const userConfig = require(configPath);
    const config = {
      rootPath: process.cwd(),
      ...userConfig,
    };
    const { schema, documentMutation } = await buildSchema(config);
    await fs.writeFileSync(
      __dirname + "/../src/schema.gql",
      printSchema(schema)
    );
    const querySchema = await fs
      .readFileSync(__dirname + "/../src/query.gql")
      .toString();

    const res = await codegen({
      // used by a plugin internally, although the 'typescript' plugin currently
      // returns the string output, rather than writing to a file
      filename: __dirname + "/../src/schema.ts",
      // schema: parse(printSchema(schema)),
      schema: parse(printSchema(schema)),
      documents: [
        {
          location: "operation.graphql",
          document: parse(querySchema),
        },
      ],
      config: {},
      plugins: [{ typescript: {} }, { typescriptOperations: {} }],
      pluginMap: {
        typescript: {
          plugin: typescriptPlugin,
        },
        typescriptOperations: {
          plugin: typescriptOperationsPlugin,
        },
      },
    });
    await fs.writeFileSync(
      process.cwd() + "/.forestry/types.ts",
      `// DO NOT MODIFY THIS FILE. This file is automatically generated by Forestry
${res}
    `
    );

    const query = await fs.readFileSync(__dirname + "/../src/query.gql");
    await fs.writeFileSync(
      process.cwd() + "/.forestry/query.ts",
      `// DO NOT MODIFY THIS FILE. This file is automatically generated by Forestry
export default \`${query}\`
`
    );

    return {
      schema,
      rootValue: {
        document: documentMutation,
      },
      graphiql: true,
      customFormatErrorFn(err: GraphQLError) {
        console.log(err);
        return {
          message: err.message,
          locations: err.locations,
          path: err.path,
        };
      },
    };
  })
);
app.listen(4001);

// mutation DocumentMutation($path: String!) {
//   document(
//     path: $path
//     params: {
//       BlockPage_input: {
//         title: "Hello"
//         blocks: [
//           {
//             Sidecar_input: {
//               text: "This is my text"
//               image: "some-image-path"
//               cta: { header: "" }
//               style: ""
//             }
//           },
//           { ExcerptPost_input: { description: "" } },
//           {
//             PriceList_input: {
//               heading: "strin"
//               prices: [
//                 {
//                   title: "HEre"
//                   description: "we"
//                   bullet_points: ["has", "tobe"]
//                 }
//               ]
//             }
//           }
//           { SponsorList_input: { sponsor: { name: "hi", url: "", image: "" } } }
//         ]
//       }
//     }
//   ) {
//     __typename
//   }
// }
