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

import { Cache } from "../cache";
import { text } from "../fields/text";
import { list } from "../fields/list";
import { select } from "../fields/select";
import { blocks } from "../fields/blocks";
import { textarea } from "../fields/textarea";
import { fieldGroup } from "../fields/field-group";
import { fieldGroupList } from "../fields/field-group-list";

import type { GraphQLFieldConfigMap } from "graphql";
import type { TemplateData } from "../types";
import type { Field } from "../fields";
import type { ContextT } from "../resolver";

/**
 * The builder holds all the functions which are required to build the schema, everything
 * starts with the documentUnion, which then trickles down through the schema, populating
 * all the fields by reading the settings.yml and template definition files.
 */
export const builder = {
  /**
   * The entrypoint to the build process. It's likely we'll have many more query fields
   * in the future.
   */
  schema: async ({ cache }: { cache: Cache }) => {
    const documentUnion = await builder._documentUnion({ cache });
    const documentInput = await builder.sectionDocumentInputObject({
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
  },
  /**
   * The top-level result, a document is a file which may be of any one of the templates
   * defined, the union consists of each template which is possible.
   */
  _documentUnion: async ({
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
   * Each `type` from the {@link _documentUnion} is built by this function.
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
  _documentDataUnion: async ({
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
   * Similar to documentObject except it only deals with unions on the data layer
   *
   * Builds out the type of data based on the provided template.
   * Each `type` from the {@link _documentDataUnion} is built by this function.
   */
  documentDataObject: async (cache: Cache, template: TemplateData) => {
    const fields: GraphQLFieldConfigMap<any, ContextT> = {};

    await Promise.all(
      template.fields.map(async (field) => {
        fields[field.name] = await buildTemplateDataField(cache, field);
      })
    );
    return cache.build(
      new GraphQLObjectType({
        name: `${template.label}Data`,
        fields,
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
            type: await builder._documentFormFieldsUnion(cache, template),
          },
        },
      })
    );
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
    const fields: GraphQLFieldConfigMap<any, ContextT> = {};

    await Promise.all(
      template.fields.map(async (field) => {
        fields[field.name] = await buildTemplateInitialValueField(cache, field);
      })
    );
    return cache.build(
      new GraphQLObjectType({
        name: `${template.label}InitialValues`,
        fields: {
          _template: { type: GraphQLString },
          ...fields,
        },
      })
    );
  },
  /**
   * Currently only used by blocks, which accepts an array of values with different shapes,
   * disambiguated by their `_template` property seen in {@link documentInitialValuesObject}.
   */
  _initialValuesUnion: async ({
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
        name: `${templates.join("")}_initialValuesUnion`,
        types,
      })
    );
  },
  /**
   * The input values for mutations to the document data
   */
  documentDataInputObject: async (cache: Cache, template: TemplateData) => {
    const fields: GraphQLInputFieldConfigMap = {};

    await Promise.all(
      template.fields.map(async (field) => {
        fields[field.name] = await buildTemplateInputDataField(cache, field);
      })
    );
    return cache.build(
      new GraphQLInputObjectType({
        name: `${template.label}InputData`,
        fields: {
          _template: { type: GraphQLString },
          ...fields,
        },
      })
    );
  },
  /**
   * The input values for the document
   */
  _documentInputObject: async (cache: Cache, template: TemplateData) => {
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
          return await builder._documentInputObject(cache, template);
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
   * A form's fields is a union of different field types
   */
  _documentFormFieldsUnion: async (
    cache: Cache,
    template: TemplateData
  ): Promise<GraphQLList<GraphQLType>> => {
    const fields = _.uniqBy(template.fields, (field) => field.type);
    const accum = await buildTemplateFormFields(cache, fields);
    return cache.build(
      GraphQLList(
        new GraphQLUnionType({
          name: `${template.__namespace || ""}${template.label}FormFields`,
          types: accum,
        })
      )
    );
  },
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
