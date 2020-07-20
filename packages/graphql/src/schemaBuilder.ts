import {
  DataSource,
  FieldType,
  Settings,
  WithFields,
} from "./datasources/datasource";
import {
  DocumentType,
  Templates,
  TemplatesData,
  configType,
} from "./fields/types";
import {
  GraphQLError,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLUnionType,
  getNamedType,
} from "graphql";
import {
  arrayToObject,
  friendlyName,
  getSectionFmtTypes,
  isDirectorySection,
  isNotNull,
  shortFMTName,
  slugify,
} from "./util";

import camelCase from "lodash.camelcase";
import flatten from "lodash.flatten";
import { generateFields } from "./fieldGenerator";
import kebabCase from "lodash.kebabcase";

require("dotenv").config();

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

  const fieldData = {
    sectionFmts,
    templateObjectTypes,
    templatePages,
    templateDataObjectTypes,
    templateFormObjectTypes,
    templateDataInputObjectTypes,
  };

  await Promise.all(
    fmtList.map(async (path) => {
      const fmt = await dataSource.getTemplate(config.siteLookup, path);

      const { getters, setters, mutators } = generateFields({
        fmt: friendlyName(path),
        fields: fmt.data.fields,
        config,
        fieldData,
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
