import * as util from "./util";

import {
  BlocksField,
  DataSource,
  DirectorySection,
  DocumentList,
  DocumentSelect,
  FieldGroupField,
  FieldGroupListField,
  FieldType,
  FileField,
  GalleryField,
  ListField,
  Section,
  SectionList,
  SectionSelect,
  SelectField,
  Settings,
  WithFields,
} from "./datasources/datasource";
import {
  GraphQLEnumType,
  GraphQLError,
  GraphQLFieldConfig,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLType,
  GraphQLUnionType,
  getNamedType,
} from "graphql";
import { boolean, datetime, number, tag_list, text, textarea } from "./fields";

import camelCase from "lodash.camelcase";
import flatten from "lodash.flatten";
import kebabCase from "lodash.kebabcase";

require("dotenv").config();

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
const getSectionFmtTypes = (
  settings: Settings,
  templateObjectTypes: Templates
) => {
  const sectionTemplates = flatten(
    settings.data.sections
      .filter(isDirectorySection)
      .map(({ templates }) => templates)
  );

  return sectionTemplates
    .map((sectionTemplate) => templateObjectTypes[sectionTemplate])
    .filter(isNotNull);
};

const getSectionFmtTypes2 = (
  section: string,
  sectionFmts: {
    name: string;
    templates: string[];
  }[],
  templateObjectTypes: Templates
) => {
  const activeSectionTemplates = sectionFmts.find(
    ({ name }) => name === section
  );
  const types = activeSectionTemplates?.templates
    .map((templateName: string) => templateObjectTypes[templateName])
    ?.filter(isNotNull);

  if (!types || types.length === 0) {
    throw new GraphQLError(`No types found for section ${section}`);
  }

  return types;
};

const getBlockFmtTypes = (
  templateTypes: string[],
  templateDataObjectTypes: TemplatesData
) => {
  return templateTypes.map((template) => templateDataObjectTypes[template]);
};
const getPagesForSection = (
  section: string,
  sectionFmts: {
    name: string;
    templates: string[];
  }[],
  templatePages: {
    name: string;
    pages: string[];
  }[]
): string[] => {
  const sectionFmt = sectionFmts.find(
    (sectionFmt) => sectionFmt.name === section
  );

  if (!sectionFmt) {
    throw new GraphQLError(`Unable to find FMT for ${section}`);
  }

  const pages = flatten(
    sectionFmt.templates.map((templateName) => {
      const meh =
        templatePages.find(({ name }) => name === templateName)?.pages || [];
      return meh;
    })
  );

  return pages;
};
const getFmtForDocument = (
  itemPath: string,
  templatePages: {
    name: string;
    pages: string[];
  }[]
): TemplatePage => {
  const fmt = templatePages.find(({ pages }) => {
    return pages?.includes(itemPath);
  });

  if (!fmt) {
    throw new GraphQLError(`Unable to find FMT for path: ${itemPath}`);
  }

  return fmt;
};
const getSectionFmtInputTypes = (
  settings: Settings,
  templateInputObjectTypes: {
    [key: string]: GraphQLInputObjectType;
  }
) => {
  const sectionTemplates = flatten(
    settings.data.sections
      .filter(isDirectorySection)
      .map(({ templates }) => templates)
  );

  return arrayToObject<GraphQLInputObjectType>(
    sectionTemplates
      .map((sectionTemplate) => templateInputObjectTypes[sectionTemplate])
      ?.filter(isNotNull),
    (obj: any, item: any) => {
      obj[(getNamedType(item) || "").toString()] = { type: item };
    }
  );
};

const getDocument = async (
  templatePages: {
    name: string;
    pages: string[];
  }[],
  args: {
    path?: string;
  },
  config: configType,
  dataSource: DataSource
): Promise<DocumentType> => {
  const path = args.path;
  if (isNullOrUndefined(path)) {
    throw new GraphQLError("Expected argument 'path'");
  }

  const activeTemplate = templatePages.find(({ pages }) => {
    return pages?.includes(path);
  });

  const document = await dataSource.getData<DocumentType>(
    config.siteLookup,
    args.path || ""
  );

  if (!activeTemplate) {
    throw new GraphQLError(`Unable to find active template for ${path}`);
  }

  return {
    ...document,
    path,
    template: activeTemplate.name,
  };
};

function isNotNull<T>(arg: T): arg is Exclude<T, null> {
  return arg !== null;
}
function isNullOrUndefined<T>(
  obj: T | null | undefined
): obj is null | undefined {
  return typeof obj === "undefined" || obj === null;
}
function isString(arg: unknown | unknown[]): arg is string {
  return typeof arg === "string";
}
function isDirectorySection(section: Section): section is DirectorySection {
  return section.type === "directory";
}
function isSelectField(field: FieldType): field is SelectField {
  return field.type === "select";
}
function isDocumentSelectField(field: FieldType): field is DocumentSelect {
  if (!isSelectField(field)) {
    return false;
  }
  return field?.config?.source?.type === "documents";
}
function isSectionSelectField(field: FieldType): field is SectionSelect {
  if (!isSelectField(field)) {
    return false;
  }
  return field?.config?.source?.type === "pages";
}
function isListValue(val: FieldSourceType): val is ListValue {
  // FIXME: not sure if this is strong enough
  return val.hasOwnProperty("template");
}
function isListField(field: FieldType): field is ListField {
  return field.type === "list";
}
function isDocumentListField(field: FieldType): field is DocumentList {
  if (!isListField(field)) {
    return false;
  }

  if (field && field.config && field?.config?.source?.type === "documents") {
    return true;
  } else {
    return false;
  }
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

type DocumentData = { [key: string]: unknown };
type DocumentType = BaseDocumentType & {
  path: string;
  template: string;
  data: DocumentData;
};

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

// TODO: want to use something more helpful here
type ListValue = { [key: string]: FieldType[] };
type FieldSourceType = FieldType | ListValue;
type FieldContextType = {
  dataSource: DataSource;
};
export type Plugin = {
  matches: (string: FieldType["type"], field: FieldType) => boolean;
  run: (
    string: FieldType["type"],
    stuff: PluginFieldArgs
  ) => GraphQLFieldConfig<FieldSourceType, FieldContextType>;
};

type configType = {
  rootPath: string;
  siteLookup: string;
};

/**
 * This is the main function in this script, it returns all the types
 */
const FMT_BASE = ".forestry/front_matter/templates";
export const buildSchema = async (
  config: configType,
  dataSource: DataSource
) => {
  const settings = await dataSource.getSettings(config.siteLookup);
  const fmtList = await dataSource.getTemplateList(config.siteLookup);

  const templateDataInputObjectTypes: {
    [key: string]: GraphQLInputObjectType;
  } = {};
  const templateInputObjectTypes: {
    [key: string]: GraphQLInputObjectType;
  } = {};
  const templateFormObjectTypes: { [key: string]: GraphQLObjectType } = {};
  const templateDataObjectTypes: TemplatesData = {};
  const templateObjectTypes: Templates = {};

  fmtList.forEach((path) => {
    templateObjectTypes[util.shortFMTName(path)] = null;
  });

  const templatePages = await Promise.all(
    fmtList.map(async (fmt) => {
      return {
        name: util.shortFMTName(fmt),
        pages: (await dataSource.getTemplate(config.siteLookup, fmt)).data
          .pages,
      };
    })
  );

  const sectionFmts = settings.data.sections
    .filter(isDirectorySection)
    .map(({ label, templates }) => {
      return {
        name: util.slugify(label),
        templates,
      };
    });

  const baseInputFields = {
    name: { type: GraphQLString },
    label: { type: GraphQLString },
    description: { type: GraphQLString },
    component: { type: GraphQLString },
  };

  const selectInput = new GraphQLObjectType<SelectField>({
    name: "SelectFormField",
    fields: {
      ...baseInputFields,
      options: { type: GraphQLList(GraphQLString) },
    },
  });

  const imageInput = new GraphQLObjectType<FileField>({
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

  const select = ({ fmt, field }: { fmt: string; field: SelectField }) => {
    if (isDocumentSelectField(field)) {
      return {
        getter: {
          type: GraphQLString,
        },
        setter: {
          type: selectInput,
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
              component: "select",
              options: Object.keys(res.data[keyPath]),
            };
          },
        },
        mutator: {
          type: GraphQLString,
        },
      };
    }
    if (isSectionSelectField(field)) {
      return {
        getter: {
          type: new GraphQLUnionType({
            name: util.friendlyName(field.name + "_select_" + fmt),
            types: () => {
              return getSectionFmtTypes2(
                field.config.source.section,
                sectionFmts,
                templateObjectTypes
              );
            },
            resolveType: async (val) => {
              return templateObjectTypes[val.template];
            },
          }),
          resolve: async (
            val: { [key: string]: unknown },
            _args: { [argName: string]: any },
            ctx: FieldContextType
          ) => {
            const path = val[field.name];
            if (isString(path)) {
              const res = await ctx.dataSource.getData<DocumentType>(
                config.siteLookup,
                path
              );
              const activeTemplate = getFmtForDocument(path, templatePages);
              return {
                ...res,
                path: val[field.name],
                template: activeTemplate?.name,
              };
            }

            throw new GraphQLError(
              `Expected index lookup to return a string for ${field.name}`
            );
          },
        },
        setter: {
          type: selectInput,
          resolve: () => {
            if (field?.config?.source?.type === "pages") {
              const options = getPagesForSection(
                field.config.source.section,
                sectionFmts,
                templatePages
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
        type: GraphQLString,
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
          name: util.friendlyName(field.name + "_select_" + fmt),
          values: options,
        }),
      },
    };
  };

  const list = ({ fmt, field }: { fmt: string; field: ListField }) => {
    if (isDocumentListField(field)) {
      return {
        getter: {
          type: GraphQLList(
            new GraphQLObjectType({
              name: util.friendlyName(field.name + "_list_" + fmt + "_item"),
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
            name: util.friendlyName(field.name + "_list_" + fmt + "_config"),
            fields: {
              ...baseInputFields,
              component: { type: GraphQLString },
              fields: {
                type: GraphQLList(
                  new GraphQLObjectType({
                    name: util.friendlyName(
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
              name: util.friendlyName(field.name + "_list_" + fmt),
              types: () => {
                return getSectionFmtTypes2(
                  field.config?.source.section || "",
                  sectionFmts,
                  templateObjectTypes
                );
              },
              resolveType: async (val: DocumentType) => {
                return templateObjectTypes[val.template];
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
                  templatePages
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
            name: util.friendlyName(field.name + "_list_" + fmt + "_config"),
            fields: {
              ...baseInputFields,
              component: { type: GraphQLString },
              fields: {
                type: GraphQLList(
                  new GraphQLObjectType({
                    name: util.friendlyName(
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
              sectionFmts,
              templatePages
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
          name: util.friendlyName(field.name + "_list_" + fmt + "_config"),
          fields: {
            ...baseInputFields,
            component: { type: GraphQLString },
            itemField: {
              type: new GraphQLObjectType({
                name: util.friendlyName(
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
  const file = ({ fmt, field }: { fmt: string; field: FileField }) => {
    return {
      getter: {
        type: new GraphQLObjectType({
          name: util.friendlyName(field.name + "_gallery_" + fmt),
          fields: {
            path: {
              type: GraphQLNonNull(GraphQLString),
              resolve: async (val) => {
                return val;
              },
            },
            absolutePath: {
              type: GraphQLString,
              resolve: async (val) => {
                return config.rootPath + val;
              },
            },
          },
        }),
      },
      setter: {
        type: imageInput,
        resolve: () => {
          return {
            name: field.name,
            label: field.label,
            component: "group",
            fields: [
              {
                name: "path",
                label: "Path",
                component: "image",
              },
            ],
          };
        },
      },
      mutator: {
        type: GraphQLString,
      },
    };
  };
  const image_gallery = ({
    fmt,
    field,
  }: {
    fmt: string;
    field: GalleryField;
  }) => {
    return {
      getter: {
        type: GraphQLList(
          new GraphQLObjectType({
            name: util.friendlyName(field.name + "_gallery_" + fmt),
            fields: {
              path: {
                type: GraphQLNonNull(GraphQLString),
                resolve: async (val) => {
                  return val;
                },
              },
              absolutePath: {
                type: GraphQLString,
                resolve: async (val) => {
                  return config.rootPath + val;
                },
              },
            },
          })
        ),
      },
      setter: {
        type: imageInput,
        resolve: () => {
          return {
            name: field.name,
            component: "group",
            fields: [
              {
                name: "path",
                label: "Path",
                component: "image",
              },
            ],
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
          name: util.friendlyName(field.name + "_fields_" + fmt),
          fields: getters,
        }),
      },
      setter: {
        type: new GraphQLObjectType<FieldGroupField>({
          name: util.friendlyName(
            field.name + "_fields_list_" + fmt + "_config"
          ),
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
                  name: util.friendlyName(
                    field.name + "_fields_list_" + fmt + "_config" + "_fields"
                  ),
                  types: () => {
                    const setterValues = Object.values(setters);
                    // FIXME:confusing - this is just making sure we only return unique items
                    return Array.from(
                      new Set(setterValues.map((item) => item.type))
                    );
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
        }),
        resolve: () => field,
      },
      mutator: {
        type: new GraphQLInputObjectType({
          name: util.friendlyName(field.name + "_fields_" + fmt + "_input"),
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
            name: util.friendlyName(field.name + "_fields_list_" + fmt),
            fields: getters,
          })
        ),
      },
      setter: {
        type: new GraphQLObjectType<FieldGroupListField>({
          name: util.friendlyName(
            field.name + "_fields_list_" + fmt + "_config"
          ),
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
                  name: util.friendlyName(
                    field.name + "_fields_list_" + fmt + "_config" + "_fields"
                  ),
                  types: () => {
                    const setterValues = Object.values(setters);
                    // FIXME:confusing - this is just making sure we only return unique items
                    return Array.from(
                      new Set(setterValues.map((item) => item.type))
                    );
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
        }),
        resolve: (val: any) => val,
      },
      mutator: {
        type: GraphQLList(
          new GraphQLInputObjectType({
            name: util.friendlyName(
              field.name + "_fields_list_" + fmt + "_input"
            ),
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
            name: util.friendlyName(field.name + "_union"),
            types: () => {
              return getBlockFmtTypes(
                field.template_types,
                templateDataObjectTypes
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
          name: util.friendlyName(field.name + "_fieldConfig"),
          fields: {
            ...baseInputFields,
            templates: {
              type: new GraphQLObjectType({
                name: util.friendlyName(field.name + "_templates"),
                fields: () => {
                  const blockObjectTypes = field.template_types.map(
                    (template) => templateFormObjectTypes[template]
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
            name: util.friendlyName(field.name + "_input"),
            fields: () => {
              return arrayToObject(field.template_types, (obj, item) => {
                obj[util.friendlyName(item + "_input")] = {
                  type: templateDataInputObjectTypes[util.shortFMTName(item)],
                };
              });
            },
          })
        ),
      },
    };
  };

  type fieldGetter = GraphQLFieldConfig<
    FieldSourceType,
    FieldContextType,
    {
      [argName: string]: GraphQLType;
    }
  >;
  type fieldSetter = {
    // FIXME: any should be replaced with the resolver function payload type
    type: GraphQLObjectType<any>;
    resolve: (
      val: FieldSourceType,
      args: {
        [argName: string]: unknown;
      },
      context: FieldContextType,
      info: unknown
    ) => unknown;
  };
  type fieldTypeType = {
    getter: fieldGetter;
    setter: fieldSetter;
    mutator: { type: GraphQLInputType };
  };

  const getFieldType = ({
    fmt,
    field,
  }: {
    fmt: string;
    field: FieldType;
  }): fieldTypeType => {
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
        return file({ fmt, field });
      case "image_gallery":
        return image_gallery({ fmt, field });
      case "field_group":
        return field_group({ fmt, field });
      case "field_group_list":
        return field_group_list({ fmt, field });
      case "blocks":
        return blocks({ fmt, field });
      default:
        throw new GraphQLError(
          `No function provided for field type ${JSON.stringify(field)}`
        );
    }
  };

  type generatedFieldsType = {
    getters: {
      [key: string]: fieldGetter;
    };
    setters: {
      [key: string]: fieldSetter;
    };
    mutators: {
      [key: string]: { type: GraphQLInputType };
    };
  };

  const generateFields = ({
    fmt,
    fields,
  }: {
    fmt: string;
    fields: FieldType[];
  }): generatedFieldsType => {
    const accumulator: generatedFieldsType = {
      getters: {},
      setters: {},
      mutators: {},
    };

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
      const fmt = await dataSource.getTemplate(config.siteLookup, path);

      const { getters, setters, mutators } = generateFields({
        fmt: util.friendlyName(path),
        fields: fmt.data.fields,
      });

      const templateDataInputObjectType = new GraphQLInputObjectType({
        name: util.friendlyName(path + "_data_input"),
        fields: mutators,
      });

      const templateInputObjectType = new GraphQLInputObjectType({
        name: util.friendlyName(path + "_input"),
        fields: {
          data: { type: templateDataInputObjectType },
          content: { type: GraphQLString },
        },
      });

      const name = util.friendlyName(path, { suffix: "field_config" });
      const field = fmt.data;
      const templateFormObjectType = {
        type: new GraphQLObjectType<WithFields>({
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
            fields: {
              type: GraphQLList(
                new GraphQLUnionType({
                  name: name + "_component_config",
                  types: () => {
                    const setterValues = Object.values(setters);
                    // FIXME:confusing - this is just making sure we only return unique items
                    return Array.from(
                      new Set(setterValues.map((item) => item.type))
                    );
                  },
                  resolveType: (val: FieldType) => {
                    const setter = setters[val.name];
                    if (!setter) {
                      console.log(val);
                      throw new GraphQLError(
                        `No setter defined for template FMT ${path}`
                      );
                    }

                    return setter.type;
                  },
                })
              ),
              resolve: async (fmtData, args, context, info) => {
                return Promise.all(
                  fmt.data.fields.map(async (field) => {
                    const setter = setters[field.name];

                    if (!setter.resolve) {
                      throw new GraphQLError(
                        `No resolver defined for ${fmtData.label}`
                      );
                    }

                    return setter.resolve(field, args, context, info);
                  })
                );
              },
            },
          },
        }),
        resolve: () => fmt.data,
      };

      const templateDataObjectType = new GraphQLObjectType({
        name: util.friendlyName(path, { suffix: "data" }),
        fields: {
          _template: {
            type: GraphQLString,
            resolve: () => util.friendlyName(path, { suffix: "field_config" }),
          },
          ...getters,
        },
      });

      const templateObjectType = new GraphQLObjectType({
        name: util.friendlyName(path),
        fields: {
          form: templateFormObjectType,
          absolutePath: { type: GraphQLString },
          path: { type: GraphQLNonNull(GraphQLString) },
          content: {
            type: GraphQLNonNull(GraphQLString),
          },
          excerpt: { type: GraphQLString },
          data: { type: GraphQLNonNull(templateDataObjectType) },
        },
      });

      templateDataInputObjectTypes[
        util.shortFMTName(path)
      ] = templateDataInputObjectType;
      templateInputObjectTypes[
        util.shortFMTName(path)
      ] = templateInputObjectType;
      templateFormObjectTypes[util.shortFMTName(path)] =
        templateFormObjectType.type;
      templateDataObjectTypes[util.shortFMTName(path)] = templateDataObjectType;
      templateObjectTypes[util.shortFMTName(path)] = templateObjectType;
    })
  );

  const documentType = new GraphQLUnionType({
    name: util.friendlyName("document_union"),
    types: () => getSectionFmtTypes(settings, templateObjectTypes),
    resolveType: (val: { template: string }): GraphQLObjectType => {
      const type = templateObjectTypes[val.template];

      if (!type) {
        throw new GraphQLError(
          `Unable to find type for ${val.template} amongst ${Object.keys(
            templateObjectTypes
          ).join(", ")}`
        );
      }

      return type;
    },
  });

  const documentInputType = {
    type: new GraphQLInputObjectType({
      name: "DocumentInput",
      fields: () => getSectionFmtInputTypes(settings, templateInputObjectTypes),
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
        resolve: async (_, args, context) => {
          return getDocument(templatePages, args, config, context.dataSource);
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

  const transform = (obj: any): any => {
    const meh: { [key: string]: any } = {};
    Object.keys(obj).map((key) => {
      const val = obj[key];
      if (Array.isArray(val)) {
        meh[key] = val.map((item) => {
          if (typeof item === "string" || typeof item === "number") {
            return item;
          }
          // Get the first item in the object
          const templateBigName = Object.keys(item)[0];

          if (templateBigName.endsWith("Input")) {
            const values = item[templateBigName];
            const accumulator = {
              template: kebabCase(templateBigName.replace("Input", "")),
              ...values,
            };
            return transform(accumulator);
          } else {
            return item;
          }
        });
      } else {
        meh[key] = obj[key];
      }
    });
    return meh;
  };

  // Mutations are transformed from a payload that is type-safe to what we eventually want to store
  // as a document - see https://github.com/graphql/graphql-spec/blob/master/rfcs/InputUnion.md
  const documentMutation = async (payload: { path: string; params: any }) => {
    const { content = "", data } = payload.params[
      // Just grabbing the first item since we're following the Tagged Union pattern
      Object.keys(payload.params)[0]
    ];

    await dataSource.writeData(
      config.siteLookup,
      payload.path,
      content,
      transform(data)
    );
  };

  return { schema, documentMutation };
};
