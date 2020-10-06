import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLUnionType,
  GraphQLList,
  getNamedType,
  GraphQLType,
  GraphQLInputObjectType,
  GraphQLInputFieldConfigMap,
} from "graphql";
import _ from "lodash";
import { text } from "./fields/text";
import { textarea } from "./fields/textarea";
import { select } from "./fields/select";
import { blocks } from "./fields/blocks";
import { fieldGroup } from "./fields/field-group";
import { fieldGroupList } from "./fields/field-group-list";
import { list } from "./fields/list";
import type { GraphQLFieldConfigMap } from "graphql";
import type { TemplateData } from "./types";
import type { Field } from "./fields";
import type { DataSource } from "./datasources/datasource";
import type { ContextT } from "./resolver";

/**
 * The builder holds all the functions which are required to build the schema, everything
 * starts with the documentUnion, which then trickles down through the schema, populating
 * all the fields by reading the settings.yml and template definition files.
 */
export const builder = {
  /**
   * The top-level result, a document is a file which may be of any one of the templates
   * defined, the union consists of each template which is possible.
   */
  documentUnion: async ({
    cache,
    section,
  }: {
    cache: Cache;
    /** If no section is provided, this is the top-level document field */
    section?: string;
  }) => {
    return cache.build(
      new GraphQLUnionType({
        name: `${section ? section : ""}DocumentUnion`,
        types: await Promise.all(
          (await cache.datasource.getTemplatesForSection(section)).map(
            async (template) => await builder.documentObject(cache, template)
          )
        ),
      })
    );
  },
  /**
   * Builds out the type of document based on the provided template.
   * Each `type` from the {@link documentUnion} is built by this function.
   */
  documentObject: async (cache: Cache, template: TemplateData) => {
    return cache.build(
      new GraphQLObjectType({
        name: template.label,
        fields: {
          path: { type: GraphQLString },
          form: { type: await builder.documentFormObject(cache, template) },
          data: { type: await builder.documentDataObject(cache, template) },
          initialValues: {
            type: await builder.documentInitialValuesObject(cache, template),
          },
        },
      })
    );
  },
  /**
   * Similar to {@link documentUnion} except it only deals with unions on the data layer.
   *
   * This is used in blocks, which stores it's values inline rather than via another document
   */
  documentDataUnion: async ({
    cache,
    templates,
  }: {
    cache: Cache;
    templates: string[];
  }) => {
    const templateObjects = await cache.datasource.getTemplates(templates);
    const types = await Promise.all(
      templateObjects.map(
        async (template) => await builder.documentDataObject(cache, template)
      )
    );
    return cache.build(
      new GraphQLUnionType({
        name: `${templates.join("")}DataUnion`,
        types,
      })
    );
  },
  /**
   * Iterate through the template fields, passing them on to their data value builders
   */
  buildTemplateDataFields: async (cache: Cache, template: TemplateData) => {
    const fields: GraphQLFieldConfigMap<any, ContextT> = {};

    await Promise.all(
      template.fields.map(async (field) => {
        fields[field.name] = await buildTemplateDataField(cache, field);
      })
    );

    return fields;
  },
  /**
   * Similar to documentObject except it only deals with unions on the data layer
   *
   * Builds out the type of data based on the provided template.
   * Each `type` from the {@link documentDataUnion} is built by this function.
   */
  documentDataObject: async (cache: Cache, template: TemplateData) => {
    return cache.build(
      new GraphQLObjectType({
        name: `${template.label}Data`,
        fields: await builder.buildTemplateDataFields(cache, template),
      })
    );
  },
  /**
   * The top-level form object for a document
   *
   * ```graphql
   * type AuthorForm = {
   *  label: String,
   *  _template: String,
   *  feilds: ...
   * }
   * ```
   */
  documentFormObject: async (cache: Cache, template: TemplateData) => {
    return cache.build(
      new GraphQLObjectType({
        name: `${template.label}Form`,
        fields: {
          label: { type: GraphQLString },
          _template: { type: GraphQLString },
          fields: {
            type: await builder.documentFormFieldsUnion(cache, template),
          },
        },
      })
    );
  },
  /**
   * Iterate through the template fields, passing them on to their initial value builders
   */
  buildTemplateInitialValueFields: async (
    cache: Cache,
    template: TemplateData
  ) => {
    const fields: GraphQLFieldConfigMap<any, ContextT> = {};

    await Promise.all(
      template.fields.map(async (field) => {
        fields[field.name] = await buildTemplateInitialValueField(cache, field);
      })
    );

    return fields;
  },
  /**
   * The [initial values](https://tinacms.org/docs/plugins/forms/#form-configuration) for the Tina form.
   *
   * `_template` is provided as a disambiguator when the result value is inside an array.
   *
   * ```graphql
   * type MyBlock = {
   *   _template: String
   *   description: String
   *   authors: [String]
   * }
   * ```
   */
  documentInitialValuesObject: async (cache: Cache, template: TemplateData) => {
    return cache.build(
      new GraphQLObjectType({
        name: `${template.label}InitialValues`,
        fields: {
          _template: { type: GraphQLString },
          ...(await builder.buildTemplateInitialValueFields(cache, template)),
        },
      })
    );
  },
  /**
   * Currently only used by blocks, which accepts an array of values with different shapes,
   * disambiguated by their `_template` property seen in {@link documentInitialValuesObject}.
   */
  initialValuesUnion: async ({
    cache,
    templates,
  }: {
    cache: Cache;
    templates: string[];
  }) => {
    const templateObjects = await cache.datasource.getTemplates(templates);
    const types = await Promise.all(
      templateObjects.map(
        async (template) =>
          await builder.documentInitialValuesObject(cache, template)
      )
    );
    return cache.build(
      new GraphQLUnionType({
        name: `${templates.join("")}InitialValuesUnion`,
        types,
      })
    );
  },
  /**
   * Iterate through the template fields, passing them on to their input builders
   */
  buildTemplateInputDataFields: async (
    cache: Cache,
    template: TemplateData
  ) => {
    const fields: GraphQLInputFieldConfigMap = {};

    await Promise.all(
      template.fields.map(async (field) => {
        fields[field.name] = await buildTemplateInputDataField(cache, field);
      })
    );

    return fields;
  },
  /**
   * The input values for mutations to the document data
   */
  documentDataInputObject: async (cache: Cache, template: TemplateData) => {
    return cache.build(
      new GraphQLInputObjectType({
        name: `${template.label}InputData`,
        fields: {
          _template: { type: GraphQLString },
          ...(await builder.buildTemplateInputDataFields(cache, template)),
        },
      })
    );
  },
  /**
   * The input values for the document
   */
  documentInputObject: async (cache: Cache, template: TemplateData) => {
    return cache.build(
      new GraphQLInputObjectType({
        name: `${template.label}Input`,
        fields: {
          content: { type: GraphQLString },
          data: {
            type: await builder.documentDataInputObject(cache, template),
          },
        },
      })
    );
  },
  /**
   * The input values for mutations to the document from a section
   */
  sectionDocumentInputObject: async ({
    cache,
    section,
  }: {
    cache: Cache;
    section?: string;
  }) => {
    const templates = await Promise.all(
      (await cache.datasource.getTemplatesForSection(section)).map(
        async (template) => {
          return await builder.documentInputObject(cache, template);
        }
      )
    );
    const accum: { [key: string]: { type: GraphQLInputObjectType } } = {};
    templates.forEach((template) => {
      accum[getNamedType(template).toString()] = { type: template };
    });
    return cache.build(
      new GraphQLInputObjectType({
        name: `${section ? section : ""}DocumentInput`,
        fields: accum,
      })
    );
  },
  /**
   * Iterate through the template fields, passing them on to their form field builders
   */
  documentFormFields: async (cache: Cache, template: TemplateData) => {
    // FIXME: This will break when there are multiple block or field group items.
    // this should be unique by field type but not if they're blocks/field groups
    const fields = _.uniqBy(template.fields, (field) => field.type);
    return await buildTemplateFormFields(cache, fields);
  },
  /**
   * A form's fields is a union of different field types
   */
  documentFormFieldsUnion: async (
    cache: Cache,
    template: TemplateData
  ): Promise<GraphQLList<GraphQLType>> => {
    return cache.build(
      GraphQLList(
        new GraphQLUnionType({
          name: `${template.__namespace || ""}${template.label}FormFields`,
          types: await builder.documentFormFields(cache, template),
        })
      )
    );
  },
};
/**
 * Holds an in-memory cache of GraphQL Objects which have been built, allowing
 * re-use and avoiding name collisions
 *
 * ```js
 * // ex. Any other uses of "SomeName" will return the cached version
 * cache.build(new GraphQLObjectType({name: 'SomeName', fields: {...}})
 * ```
 */
export type Cache = {
  /** Pass any GraphQLType through and it will check the cache before creating a new one to avoid duplicates */
  build: <T extends GraphQLType>(gqlType: T) => T;
  datasource: DataSource;
  /**
   * The builder holds all the functions which are required to build the schema, everything
   * starts with the documentUnion, which then trickles down through the schema, populating
   * all the fields by reading the settings.yml and template definition files.
   */
  builder: typeof builder;
};

/**
 * Initialize the cache and datastore services, which keep in-memory
 * state when being used throughout the build process.
 */
export const cacheInit = (
  datasource: DataSource,
  storage: { [key: string]: GraphQLType }
) => {
  const cache: Cache = {
    build: (gqlType) => {
      const name = getNamedType(gqlType).toString();
      if (storage[name]) {
        return storage[name];
      } else {
        storage[name] = gqlType;
      }

      return gqlType as any; // allows gqlType's internal type to pass through
    },
    datasource: datasource,
    builder,
  };

  return cache;
};

export const schemaBuilder = async ({
  datasource,
}: {
  datasource: DataSource;
}) => {
  const storage: {
    [key: string]: GraphQLType;
  } = {};
  const cache = cacheInit(datasource, storage);

  const documentUnion = await cache.builder.documentUnion({ cache });
  const documentInput = await cache.builder.sectionDocumentInputObject({
    cache,
  });
  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "Query",
      fields: {
        document: {
          args: {
            path: { type: GraphQLString },
          },
          type: documentUnion,
        },
      },
    }),
    mutation: new GraphQLObjectType({
      name: "Mutation",
      fields: {
        // addDocument: {
        //   type: '',
        //   args: {
        //     path: { type: GraphQLNonNull(GraphQLString)},
        //     params: ''
        //   }
        // },
        updateDocument: {
          type: documentUnion,
          args: {
            path: { type: GraphQLNonNull(GraphQLString) },
            params: {
              type: documentInput,
            },
          },
        },
        // updateDocument: {
        //   type: '',
        //   args: {
        //     path: { type: GraphQLNonNull(GraphQLString)},
        //   }
        // }
      },
    }),
  });

  return schema;
};

const buildTemplateFormFields = async (cache: Cache, fields: Field[]) => {
  return Promise.all(
    fields.map(async (field) => {
      switch (field.type) {
        case "text":
          return text.build.field({ cache, field });
        case "textarea":
          return textarea.build.field({ cache, field });
        case "select":
          return select.build.field({ cache, field });
        case "blocks":
          return blocks.build.field({ cache, field });
        case "field_group_list":
          return fieldGroupList.build.field({ cache, field });
        case "field_group":
          return fieldGroup.build.field({ cache, field });
        case "list":
          return list.build.field({ cache, field });
      }
    })
  );
};

const buildTemplateDataField = async (cache: Cache, field: Field) => {
  switch (field.type) {
    case "text":
      return text.build.value({ cache, field });
    case "textarea":
      return textarea.build.value({ cache, field });
    case "select":
      return await select.build.value({ cache, field });
    case "blocks":
      return await blocks.build.value({ cache, field });
    case "field_group":
      return await fieldGroup.build.value({ cache, field });
    case "field_group_list":
      return await fieldGroupList.build.value({ cache, field });
    case "list":
      return await list.build.value({ cache, field });
  }
};

const buildTemplateInputDataField = async (cache: Cache, field: Field) => {
  switch (field.type) {
    case "text":
      return text.build.input({ cache, field });
    case "textarea":
      return textarea.build.input({ cache, field });
    case "select":
      return await select.build.input({ cache, field });
    case "blocks":
      return await blocks.build.input({ cache, field });
    case "field_group":
      return await fieldGroup.build.input({ cache, field });
    case "field_group_list":
      return await fieldGroupList.build.input({ cache, field });
    case "list":
      return await list.build.input({ cache, field });
  }
};

const buildTemplateInitialValueField = async (cache: Cache, field: Field) => {
  switch (field.type) {
    case "text":
      return text.build.initialValue({ cache, field });
    case "textarea":
      return textarea.build.initialValue({ cache, field });
    case "select":
      return await select.build.initialValue({ cache, field });
    case "blocks":
      return await blocks.build.initialValue({ cache, field });
    case "field_group":
      return await fieldGroup.build.initialValue({ cache, field });
    case "field_group_list":
      return await fieldGroupList.build.initialValue({ cache, field });
    case "list":
      return await list.build.initialValue({ cache, field });
  }
};
