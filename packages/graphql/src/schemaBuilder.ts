import {
  BlocksField,
  DataSource,
  FieldGroupField,
  FieldGroupListField,
  FieldType,
  FileField,
  SelectField,
  Settings,
  WithFields,
} from "./datasources/datasource";
import {
  DocumentType,
  FieldContextType,
  FieldSourceType,
  Templates,
  TemplatesData,
  configType,
} from "./fields/types";
import {
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
import {
  boolean,
  datetime,
  image_gallery,
  number,
  tag_list,
  text,
  textarea,
} from "./fields";
import {
  friendlyName,
  getSectionFmtTypes,
  isDirectorySection,
  isNotNull,
  shortFMTName,
  slugify,
} from "./util";

import camelCase from "lodash.camelcase";
import { file } from "./fields/file";
import flatten from "lodash.flatten";
import kebabCase from "lodash.kebabcase";
import { list } from "./fields/list";
import { select } from "./fields/select";

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

const getBlockFmtTypes = (
  templateTypes: string[],
  templateDataObjectTypes: TemplatesData
) => {
  return templateTypes.map((template) => templateDataObjectTypes[template]);
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

function isNullOrUndefined<T>(
  obj: T | null | undefined
): obj is null | undefined {
  return typeof obj === "undefined" || obj === null;
}

/**
 * This is the main function in this script, it returns all the types
 */
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
    templateObjectTypes[shortFMTName(path)] = null;
  });

  const templatePages = await Promise.all(
    fmtList.map(async (fmt) => {
      return {
        name: shortFMTName(fmt),
        pages: (await dataSource.getTemplate(config.siteLookup, fmt)).data
          .pages,
      };
    })
  );

  const sectionFmts = settings.data.sections
    .filter(isDirectorySection)
    .map(({ label, templates }) => {
      return {
        name: slugify(label),
        templates,
      };
    });

  const fieldData = { sectionFmts, templateObjectTypes, templatePages };
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
        type: new GraphQLObjectType<FieldGroupField>({
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
        type: new GraphQLObjectType<FieldGroupListField>({
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
              resolve: () => "group-list",
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
          name: friendlyName(field.name + "_fieldConfig"),
          fields: {
            ...baseInputFields,
            templates: {
              type: new GraphQLObjectType({
                name: friendlyName(field.name + "_templates"),
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
            name: friendlyName(field.name + "_input"),
            fields: () => {
              return arrayToObject(field.template_types, (obj, item) => {
                obj[friendlyName(item + "_input")] = {
                  type: templateDataInputObjectTypes[shortFMTName(item)],
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
        return select({ fmt, field, config, fieldData });
      case "datetime":
        return datetime({ fmt, field });
      case "tag_list":
        return tag_list({ fmt, field });
      case "list":
        return list({ fmt, field, config, fieldData });
      case "file":
        return file({ fmt, field, config });
      case "image_gallery":
        return image_gallery({ fmt, field, config });
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
        fmt: friendlyName(path),
        fields: fmt.data.fields,
      });

      const templateDataInputObjectType = new GraphQLInputObjectType({
        name: friendlyName(path + "_data_input"),
        fields: mutators,
      });

      const templateInputObjectType = new GraphQLInputObjectType({
        name: friendlyName(path + "_input"),
        fields: {
          data: { type: templateDataInputObjectType },
          content: { type: GraphQLString },
        },
      });

      const name = friendlyName(path, { suffix: "field_config" });
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
        name: friendlyName(path, { suffix: "data" }),
        fields: {
          _template: {
            type: GraphQLString,
            resolve: () => friendlyName(path, { suffix: "field_config" }),
          },
          ...getters,
        },
      });

      const templateObjectType = new GraphQLObjectType({
        name: friendlyName(path),
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
        shortFMTName(path)
      ] = templateDataInputObjectType;
      templateInputObjectTypes[shortFMTName(path)] = templateInputObjectType;
      templateFormObjectTypes[shortFMTName(path)] = templateFormObjectType.type;
      templateDataObjectTypes[shortFMTName(path)] = templateDataObjectType;
      templateObjectTypes[shortFMTName(path)] = templateObjectType;
    })
  );

  const documentType = new GraphQLUnionType({
    name: friendlyName("document_union"),
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
