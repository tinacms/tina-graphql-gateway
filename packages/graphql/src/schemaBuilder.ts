import {
  ConfigType,
  DocumentType,
  FieldData,
  FieldSetter,
  Templates,
  TemplatesData,
} from "./fields/types";
import {
  DataSource,
  FMT,
  FieldType,
  WithFields,
} from "./datasources/datasource";
import {
  GraphQLError,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLUnionType,
} from "graphql";
import { friendlyFMTName, shortFMTName } from "@forestryio/graphql-helpers";
import {
  getSectionFmtInputTypes,
  getSectionFmtTypes,
  getSectionFmts,
  isNullOrUndefined,
} from "./util";

import camelCase from "lodash.camelcase";
import { generateFieldAccessors } from "./fieldGenerator";
import kebabCase from "lodash.kebabcase";

/**
 * This is the main function in this script, it returns all the types
 */
export const buildSchema = async (
  config: ConfigType,
  dataSource: DataSource
) => {
  const settings = await dataSource.getSettings(config.siteLookup);
  const fmtList = await dataSource.getTemplateList(config.siteLookup);

  // for a given FMT we build a list of input types (used for mutation) corresponding
  // to the fields used in the FMT. These fields are wrapped in a `data` object.
  // This keeps tracking of inputs on the `data` object
  const templateDataInputObjectTypes: {
    [key: string]: GraphQLInputObjectType;
  } = {};
  // This keeps track of the fields inside the `data`  object
  const templateInputObjectTypes: {
    [key: string]: GraphQLInputObjectType;
  } = {};

  // A GraphQL response contains a `form` property (for building Tina form config) this
  // contains the GraphQLObjectTypes for form objects that map to FMTs
  const templateFormObjectTypes: { [key: string]: GraphQLObjectType } = {};

  // A GraphQL response contains a `data` property, this contains the GraphQLObject types
  // for data that is described by FMTs
  const templateDataObjectTypes: TemplatesData = {};

  // This keeps track of GraphQLObjectType that encapsulates the `data` and `form` data (mentioned above)
  // and probably some other things
  const templateObjectTypes: Templates = {};

  fmtList.forEach((path) => {
    templateObjectTypes[shortFMTName(path)] = null;
  });

  // build a list of all FMTs and the pages that are contained within the FMT.
  const templatePages = await Promise.all(
    fmtList.map(async (fmt) => {
      return {
        name: shortFMTName(fmt),
        pages: (await dataSource.getTemplate(config.siteLookup, fmt)).data
          .pages,
      };
    })
  );

  // build a list of all directory sections from the settings file, associate each section with it's FMTs
  const sectionFmts = getSectionFmts(settings.data.sections);

  const fieldData: FieldData = {
    sectionFmts,
    templateObjectTypes,
    templatePages,
    templateDataObjectTypes,
    templateFormObjectTypes,
    templateDataInputObjectTypes,
  };

  await Promise.all(
    fmtList.map(async (path) => {
      // get the FMT, contains all the metadata and the pages that use the FMT
      const fmt = await dataSource.getTemplate(config.siteLookup, path);

      // get all of the accessors and mutators for all of  the fields in the FMT
      const { getters, setters, mutators } = generateFieldAccessors({
        fmt: friendlyFMTName(path),
        fields: fmt.data.fields,
        config,
        fieldData,
      });

      const templateDataInputObjectType = new GraphQLInputObjectType({
        name: friendlyFMTName(path + "_data_input"),
        fields: mutators,
      });

      const templateInputObjectType = new GraphQLInputObjectType({
        name: friendlyFMTName(path + "_input"),
        fields: {
          data: { type: templateDataInputObjectType },
          content: { type: GraphQLString },
        },
      });

      const templateFormObjectType = {
        type: generateTemplateFormObjectType(fmt, setters, path),
        resolve: () => fmt.data,
      };

      const templateDataObjectType = new GraphQLObjectType({
        name: friendlyFMTName(path, { suffix: "data" }),
        fields: {
          _template: {
            type: GraphQLString,
            resolve: () => friendlyFMTName(path, { suffix: "field_config" }),
          },
          ...getters,
          content: {
            type: GraphQLString,
          },
          excerpt: { type: GraphQLString },
        },
      });

      const templateObjectType = new GraphQLObjectType({
        name: friendlyFMTName(path),
        fields: {
          form: templateFormObjectType,
          absolutePath: { type: GraphQLString },
          path: { type: GraphQLNonNull(GraphQLString) },
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
    name: friendlyFMTName("document_union"),
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
      updateDocument: {
        type: documentType,
        args: {
          path: { type: GraphQLNonNull(GraphQLString) },
          params: documentInputType,
        },
      },
      addDocument: {
        type: documentType,
        args: {
          path: { type: GraphQLNonNull(GraphQLString) },
          template: { type: GraphQLNonNull(GraphQLString) },
          params: documentInputType,
        },
      },
      deleteDocument: {
        type: documentType,
        args: {
          path: { type: GraphQLNonNull(GraphQLString) },
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
  const updateDocumentMutation = async (payload: {
    path: string;
    params: any;
  }) => {
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

  const addDocumentMutation = async (payload: {
    path: string;
    template: string;
    params: any;
  }) => {
    const { content = "", data } = payload.params[
      // Just grabbing the first item since we're following the Tagged Union pattern
      Object.keys(payload.params)[0]
    ];

    await dataSource.createContent(
      config.siteLookup,
      payload.path,
      content,
      transform(data),
      payload.template
    );
  };

  const deleteDocumentMutation = async (payload: { path: string }) => {
    await dataSource.deleteContent(config.siteLookup, payload.path);
  };

  return {
    schema,
    updateDocumentMutation,
    addDocumentMutation,
    deleteDocumentMutation,
  };
};

const getDocument = async (
  templatePages: {
    name: string;
    pages: string[];
  }[],
  args: {
    path?: string;
  },
  config: ConfigType,
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

const generateTemplateFormObjectType = (
  fmt: FMT,
  setters: {
    [key: string]: FieldSetter;
  },
  path: string
) => {
  const name = friendlyFMTName(path, { suffix: "field_config" });
  const field = fmt.data;
  return new GraphQLObjectType<WithFields>({
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
              return Array.from(new Set(setterValues.map((item) => item.type)));
            },
            resolveType: (val: FieldType) => {
              const setter = setters[val.name];
              if (!setter) {
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
  });
};
