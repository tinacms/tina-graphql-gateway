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
  printType,
  printSchema,
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
export interface Builder {
  /**
   * Builds the input type for document data
   *
   * ```graphql
   * # example
   * input PostInputData {
   *   _template: String
   *   title: String
   *   author: String
   * }
   * ```
   *
   * See {@link Resolver.documentDataInputObject} for the equivalent resolver
   */
  documentDataInputObject: (
    cache: Cache,
    template: TemplateData,
    returnTemplate?: boolean
  ) => Promise<GraphQLInputObjectType>;
  /**
   * Similar to documentObject except it only deals with unions on the data layer
   *
   * Builds out the type of data based on the provided template.
   * Each `type` from the {@link documentDataUnion} is built by this function.
   *
   * ```graphql
   * # example
   * type PostData {
   *   title: String
   *   author: AuthorDocument
   * }
   * ```
   *
   * See {@link Resolver.documentDataObject} for the equivalent resolver
   */
  documentDataObject: (
    cache: Cache,
    template: TemplateData,
    returnTemplate?: boolean
  ) => Promise<GraphQLObjectType<any, any>>;
  /**
   * Similar to {@link documentUnion} except it only deals with unions on the data layer.
   *
   * This is used in blocks, which stores it's values inline rather than via another document
   *
   * ```graphql
   * union blockDataUnion = HeroData | FeaturedPostData
   * ```
   *
   * Note that there is no equivalent `Resolver` for unions, this is because instead of providing a `typeResolver`, we
   * return the `__typename` from each possible type (which GraphQL uses if no `typeResolver` function is provided)
   */
  documentDataUnion: (args: {
    cache: Cache;
    templates: string[];
    returnTemplate: boolean;
  }) => Promise<GraphQLUnionType>;
  /**
   * A form's fields is a union of different field types
   *
   * ```graphql
   * # example:
   * union PostFormFields = TextareaField | SelectField
   * # this actually returns a list of this union, meaning we have an array of unlike objects
   * [PostFormFields]
   * ```
   *
   * Note that there is no equivalent `Resolver` for unions, this is because instead of providing a `typeResolver`, we
   * return the `__typename` from each possible type (which GraphQL uses if no `typeResolver` function is provided)
   */
  documentFormFieldsUnion: (
    cache: Cache,
    template: TemplateData
  ) => Promise<GraphQLList<GraphQLType>>;
  /**
   * The top-level form type for a document
   *
   * ```graphql
   * # example
   * type AuthorForm = {
   *  _template: String,
   *  label: String,
   *  fields: [AuthorFormFields]
   * }
   * ```
   * See {@link Resolver.documentFormObject} for the equivalent resolver
   */
  documentFormObject: (
    cache: Cache,
    template: TemplateData
  ) => Promise<GraphQLObjectType<any, any>>;
  /**
   * The [initial values](https://tinacms.org/docs/plugins/forms/#form-configuration) for the Tina form.
   *
   * `_template` is provided as a disambiguator when the result value is inside an array.
   *
   * ```graphql
   * type PostInitialValues {
   *   _template: String
   *   title: String
   *   author: String
   *   categories: [CategoryData]
   * }
   * ```
   *
   * See {@link Resolver.documentInitialValuesObject} for the equivalent resolver
   */
  documentInitialValuesObject: (
    cache: Cache,
    template: TemplateData,
    returnTemplate?: boolean
  ) => Promise<GraphQLObjectType<any, any>>;
  /**
   * The input values for the document. See {@link documentDataInputObject} for the data input portion.
   * ```graphql
   * # example
   * input PostInput {
   *   content: String
   *   data: PostInputData
   * }
   * ```
   *
   * See {@link Resolver.documentInputObject} for the equivalent resolver
   */
  documentInputObject: (
    cache: Cache,
    template: TemplateData
  ) => Promise<GraphQLInputObjectType>;
  /**
   * Builds out the type of document based on the provided template.
   * Each `type` from the {@link documentUnion} is built by this function.
   *
   * ```graphql
   * type Post {
   *  path: String
   *  form: PostForm
   *  data: PostData
   *  initialValues: PostInitialValues
   * }
   * ```
   *
   * See {@link Resolver.documentObject} for the equivalent resolver
   */
  documentObject: (
    cache: Cache,
    template: TemplateData
  ) => Promise<GraphQLObjectType<any, any>>;
  /**
   * The input values for mutations to the document from a section
   *
   * ```graphql
   * # Example
   * input DocumentInput {
   *  PostInput: PostInput
   *  AuthorInput: AuthorInput
   * }
   * ```
   *
   * Note that while this isn't a union, it's behaving close to one,
   * GraphQL doesn't support unions in mutations, so instead each key
   * (ex. `PostInput`) is the property we require when accepting a mutation.
   *
   * So if your payload looked like this it'd be considered invalid, while it's
   * possible to provide both `PostInput` and `AuthorInput` from the schema's perspective
   * , we'll throw an error, changing the author data at path `posts/1.md` makes no sense:
   *
   * ```json
   * {
   *  "path": "posts/1.md",
   *  "params": {
   *    "PostInput": {
   *      "data": {
   *        ...
   *    "AuthorInput": {
   *      "data": {
   *        ...
   * ```

   * [Read more about the trade-offs here](https://github.com/graphql/graphql-spec/blob/master/rfcs/InputUnion.md#-5-one-of-tagged-union)

   */
  documentTaggedUnionInputObject: (args: {
    cache: Cache;
    section?: string;
  }) => Promise<GraphQLInputObjectType>;
  /**
   * The top-level result, a document is a file which may be of any one of the templates
   * defined, the union consists of each template which is possible.
   *
   * ```graphql
   * union DocumentUnion = Post | Page
   * ```
   *
   * Note that this is also used on section-level references as well. If you have a `post` template
   * which has an `authors` reference, that author document could consist of multiple template types.
   * An example might be that some authors use a more detailed template, while others are very basic
   *
   * ```graphql
   * union authorsDocumentUnion = DetailedAuthor | BasicAuthor
   * ```
   * In this example the `authorsDocumentUnion` would be referenced in the `Post`'s type (notice that the
   * `authorsDocumentUnion` is "namespaced" by the section slug `authors`)
   * ```graphql
   * type PostData {
   *   title: String
   *   author: AuthorDocument
   * }
   *
   * type AuthorDocument {
   *   document: authorsDocumentUnion
   * }
   *
   * union authorsDocumentUnion = DetailedAuthor | BasicAuthor
   * ```
   */
  documentUnion: (args: {
    cache: Cache;
    /** If no section is provided, this is the top-level document field */
    section?: string;
  }) => Promise<GraphQLUnionType>;
  /**
   * Currently only used by blocks, which accepts an array of values with different shapes,
   * disambiguated by their `_template` property seen in {@link documentInitialValuesObject}.
   *
   * ```graphql
   * union sectionInitialValuesUnion = HeroInitialValues | FeaturedPostInitialValues
   *
   * type HeroInitialValues {
   *   _template: String
   *   description: String
   *   image: String
   * }
   *
   * type FeaturedPostInitialValues {
   *   _template: String
   *   cta: String
   *   post: Post
   * }
   * ```
   */
  initialValuesUnion: (args: {
    cache: Cache;
    templates: string[];
    returnTemplate?: boolean;
  }) => Promise<GraphQLUnionType>;
  /**
   * The entrypoint to the build process. It's likely we'll have many more query fields
   * in the future.
   *
   *  ```graphql
   * # example
   *  type Query {
   *    document(path: String): DocumentUnion
   *  }
   *
   *  union DocumentUnion = Post | Author
   *
   *  type Mutation {
   *    updateDocument(path: String!, params: DocumentInput): DocumentUnion
   *  }
   *
   *  input DocumentInput {
   *    PostInput: PostInput
   *    AuthorInput: AuthorInput
   *  }
   *
   *  ...
   *  ```
   */
  schema: (args: {
    cache: Cache;
    /** If no section is provided, this is the top-level document field */
    section?: string;
  }) => Promise<GraphQLSchema>;
}

/**
 * @internal this is redundant in documentation
 */
export const builder: Builder = {
  schema: async ({ cache }: { cache: Cache }) => {
    const documentUnion = await builder.documentUnion({ cache });
    const documentInput = await builder.documentTaggedUnionInputObject({
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
  documentUnion: async ({ cache, section }) => {
    const name = `${section ? section : ""}DocumentUnion`;
    return cache.build(
      new GraphQLUnionType({
        name,
        types: await Promise.all(
          (await cache.datasource.getTemplatesForSection(section)).map(
            async (template) => await builder.documentObject(cache, template)
          )
        ),
      })
    );
  },
  documentObject: async (cache: Cache, template: TemplateData) => {
    return cache.build(
      new GraphQLObjectType({
        name: template.name,
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
  documentDataUnion: async ({ cache, templates, returnTemplate }) => {
    const templateObjects = await cache.datasource.getTemplates(templates);
    const types = await Promise.all(
      templateObjects.map(
        async (template) =>
          await builder.documentDataObject(cache, template, returnTemplate)
      )
    );
    return cache.build(
      new GraphQLUnionType({
        name: `${templates.join("")}DataUnion`,
        types,
      })
    );
  },
  documentDataObject: async (cache, template, returnTemplate) => {
    const fields: GraphQLFieldConfigMap<any, ContextT> = {};

    await Promise.all(
      template.fields.map(async (field) => {
        fields[field.name] = await buildTemplateDataField(cache, field);
      })
    );

    if (returnTemplate) {
      fields.template = { type: GraphQLString };
    }

    return cache.build(
      new GraphQLObjectType({
        name: `${template.name}Data`,
        fields,
      })
    );
  },
  documentFormObject: async (cache: Cache, template: TemplateData) => {
    return cache.build(
      new GraphQLObjectType({
        name: `${template.name}Form`,
        fields: {
          label: { type: GraphQLString },
          name: { type: GraphQLString },
          fields: {
            type: await builder.documentFormFieldsUnion(cache, template),
          },
        },
      })
    );
  },
  documentInitialValuesObject: async (cache, template, returnTemplate) => {
    const fields: GraphQLFieldConfigMap<any, ContextT> = {};

    await Promise.all(
      template.fields.map(async (field) => {
        fields[field.name] = await buildTemplateInitialValueField(cache, field);
      })
    );

    if (returnTemplate) {
      fields._template = { type: GraphQLString };
    }

    return cache.build(
      new GraphQLObjectType({
        name: `${template.name}InitialValues`,
        fields: {
          ...fields,
        },
      })
    );
  },
  initialValuesUnion: async ({ cache, templates, returnTemplate }) => {
    const templateObjects = await cache.datasource.getTemplates(templates);
    const types = await Promise.all(
      templateObjects.map(
        async (template) =>
          await builder.documentInitialValuesObject(
            cache,
            template,
            returnTemplate
          )
      )
    );
    return cache.build(
      new GraphQLUnionType({
        name: `${templates.join("")}InitialValuesUnion`,
        types,
      })
    );
  },
  documentDataInputObject: async (cache, template, returnTemplate) => {
    const fields: GraphQLInputFieldConfigMap = {};

    await Promise.all(
      template.fields.map(async (field) => {
        if (field.config?.required) {
          fields[field.name] = {
            type: GraphQLNonNull(
              await buildTemplateInputDataField(cache, field)
            ),
          };
        } else {
          fields[field.name] = {
            type: await buildTemplateInputDataField(cache, field),
          };
        }
      })
    );
    if (returnTemplate) {
      fields.template = { type: GraphQLString };
    }
    return cache.build(
      new GraphQLInputObjectType({
        name: `${template.name}InputData`,
        fields,
      })
    );
  },
  documentInputObject: async (cache: Cache, template: TemplateData) => {
    return cache.build(
      new GraphQLInputObjectType({
        name: `${template.name}Input`,
        fields: {
          content: { type: GraphQLString },
          data: {
            type: await builder.documentDataInputObject(cache, template),
          },
        },
      })
    );
  },
  documentTaggedUnionInputObject: async ({
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
  documentFormFieldsUnion: async (
    cache: Cache,
    template: TemplateData
  ): Promise<GraphQLList<GraphQLType>> => {
    const fields = _.uniqBy(template.fields, (field) => field.type);
    const accum = await buildTemplateFormFields(cache, fields);
    return cache.build(
      GraphQLList(
        new GraphQLUnionType({
          name: `${template.__namespace || ""}${template.name}FormFields`,
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
