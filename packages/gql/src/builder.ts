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
import type { TemplateData, WithFields } from "./types";
import type { Field } from "./fields";
import type { DataSource } from "./datasources/datasource";
import type { ContextT } from "./resolver";

const buildTemplateFormField = async (cache: Cache, field: Field) => {
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
};

type BuildTemplateDataFields = (
  cache: Cache,
  template: TemplateData
) => Promise<GraphQLFieldConfigMap<any, ContextT>>;
const buildTemplateDataFields: BuildTemplateDataFields = async (
  cache,
  template
) => {
  const fields: GraphQLFieldConfigMap<any, ContextT> = {};

  await Promise.all(
    template.fields.map(async (field) => {
      switch (field.type) {
        case "text":
          fields[field.name] = text.build.value({
            cache,
            field,
          });
          break;
        case "textarea":
          fields[field.name] = textarea.build.value({
            cache,
            field,
          });
          break;
        case "select":
          fields[field.name] = await select.build.value({
            cache,
            field,
          });
          break;
        case "blocks":
          fields[field.name] = await blocks.build.value({
            cache,
            field,
          });
          break;
        case "field_group":
          fields[field.name] = await fieldGroup.build.value({
            cache,
            field,
          });
          break;
        case "field_group_list":
          fields[field.name] = await fieldGroupList.build.value({
            cache,
            field,
          });
          break;
        case "list":
          fields[field.name] = await list.build.value({
            cache,
            field,
          });
          break;
      }
    })
  );

  return fields;
};

type BuildTemplateInputDataFields = (
  cache: Cache,
  template: TemplateData
) => Promise<GraphQLInputFieldConfigMap>;
const buildTemplateInputDataFields: BuildTemplateInputDataFields = async (
  cache,
  template
) => {
  const fields: GraphQLInputFieldConfigMap = {};

  await Promise.all(
    template.fields.map(async (field) => {
      switch (field.type) {
        case "text":
          fields[field.name] = text.build.input({
            cache,
            field,
          });
          break;
        case "textarea":
          fields[field.name] = textarea.build.input({
            cache,
            field,
          });
          break;
        case "select":
          fields[field.name] = await select.build.input({
            cache,
            field,
          });
          break;
        case "blocks":
          fields[field.name] = await blocks.build.input({
            cache,
            field,
          });
          break;
        case "field_group":
          fields[field.name] = await fieldGroup.build.input({
            cache,
            field,
          });
          break;
        case "field_group_list":
          fields[field.name] = await fieldGroupList.build.input({
            cache,
            field,
          });
          break;
        case "list":
          fields[field.name] = await list.build.input({
            cache,
            field,
          });
          break;
      }
    })
  );

  return fields;
};

type BuildTemplateInitialValueFields = (
  cache: Cache,
  template: TemplateData
) => Promise<GraphQLFieldConfigMap<any, ContextT>>;
const buildTemplateInitialValueFields: BuildTemplateInitialValueFields = async (
  cache,
  template
) => {
  const fields: GraphQLFieldConfigMap<any, ContextT> = {};

  await Promise.all(
    template.fields.map(async (field) => {
      switch (field.type) {
        case "text":
          fields[field.name] = text.build.initialValue({
            cache,
            field,
          });
          break;
        case "textarea":
          fields[field.name] = textarea.build.initialValue({
            cache,
            field,
          });
          break;
        case "select":
          fields[field.name] = await select.build.initialValue({
            cache,
            field,
          });
          break;
        case "blocks":
          fields[field.name] = await blocks.build.initialValue({
            cache,
            field,
          });
          break;
        case "field_group":
          fields[field.name] = await fieldGroup.build.initialValue({
            cache,
            field,
          });
          break;
        case "field_group_list":
          fields[field.name] = await fieldGroupList.build.initialValue({
            cache,
            field,
          });
          break;
        case "list":
          fields[field.name] = await list.build.initialValue({
            cache,
            field,
          });
          break;
      }
    })
  );

  return fields;
};

const buildTemplateFormFields = async (
  cache: Cache,
  template: TemplateData
) => {
  // Unique by field.type
  const fields = _.uniqBy(template.fields, (field) => field.type);
  return Promise.all(
    fields.map(async (field) => await buildTemplateFormField(cache, field))
  );
};

type BuildTemplateFormFieldsUnion = (
  cache: Cache,
  template: TemplateData
) => Promise<GraphQLList<GraphQLType>>;

/**
 * Builds a union of fields for a form's field property
 *
 * ```graphql
 * union AuthorFormFields = TextareaFormField | SelectFormField
 * ```
 */
const buildTemplateFormFieldsUnion: BuildTemplateFormFieldsUnion = async (
  cache,
  template
) => {
  return cache.build(
    GraphQLList(
      new GraphQLUnionType({
        name: `${template.__namespace || ""}${template.label}FormFields`,
        types: await buildTemplateFormFields(cache, template),
      })
    )
  );
};

type BuildTemplateForm = (
  cache: Cache,
  template: TemplateData
) => Promise<GraphQLObjectType<any, any>>;
const buildTemplateForm: BuildTemplateForm = async (cache, template) => {
  const t = template;
  return cache.build(
    new GraphQLObjectType({
      name: `${template.label}Form`,
      fields: {
        label: { type: GraphQLString },
        fields: { type: await buildTemplateFormFieldsUnion(cache, t) },
      },
    })
  );
};

/**
 * Builds the data key for each template
 *
 * ```graphql
 * # Example
 * type PostData {
 *   title: String
 *   author: String
 *   sections: String
 * }
 * ```
 */
type BuildTemplateData = (
  cache: Cache,
  template: TemplateData
) => Promise<GraphQLObjectType<any, ContextT>>;
const buildTemplateData = async (cache: Cache, template: TemplateData) => {
  return cache.build(
    new GraphQLObjectType({
      name: `${template.label}Data`,
      fields: await buildTemplateDataFields(cache, template),
    })
  );
};

type BuildTemplateInputData = (
  cache: Cache,
  template: TemplateData
) => Promise<GraphQLInputObjectType>;
const buildTemplateInputData = async (cache: Cache, template: TemplateData) => {
  return cache.build(
    new GraphQLInputObjectType({
      name: `${template.label}InputData`,
      fields: await buildTemplateInputDataFields(cache, template),
    })
  );
};

type BuildInitialValues = (
  cache: Cache,
  template: TemplateData
) => Promise<GraphQLObjectType<any, ContextT>>;
const buildInitialValues = async (cache: Cache, template: TemplateData) => {
  return cache.build(
    new GraphQLObjectType({
      name: `${template.label}InitialValues`,
      fields: {
        _template: { type: GraphQLString },
        ...(await buildTemplateInitialValueFields(cache, template)),
      },
    })
  );
};

/**
 * Builds the main shape of the template
 *
 * ```graphql
 * # Example
 * type Post {
 *   form: PostForm
 *   content: String
 *   data: PostData
 * }
 * ```
 */
const buildTemplate = async (cache: Cache, template: TemplateData) => {
  return cache.build(
    new GraphQLObjectType({
      name: template.label,
      fields: {
        form: { type: await buildTemplateForm(cache, template) },
        path: { type: GraphQLString },
        data: { type: await buildTemplateData(cache, template) },
        initialValues: { type: await buildInitialValues(cache, template) },
      },
    })
  );
};

const buildTemplateInput = async (cache: Cache, template: TemplateData) => {
  return cache.build(
    new GraphQLInputObjectType({
      name: `${template.label}Input`,
      fields: {
        content: { type: GraphQLString },
        data: { type: await buildTemplateInputData(cache, template) },
      },
    })
  );
};

const buildDocumentTypes = async ({
  cache,
  section,
}: {
  cache: Cache;
  section?: string;
}): Promise<GraphQLObjectType<any, any>[]> => {
  return Promise.all(
    (await cache.datasource.getTemplatesForSection(section)).map(
      async (template) => {
        const t = template;
        return await buildTemplate(cache, t);
      }
    )
  );
};

/**
 * Same as BuildDocumentUnion except that it only builds the `data` portion, used
 * for block children
 *
 * ```graphql
 * # Example
 * union PostAuthorDataUnion = PostData | AuthorData
 * ```
 */
type BuildDataUnion = ({
  cache,
  templates,
}: {
  cache: Cache;
  templates: string[];
}) => Promise<GraphQLUnionType>;
const buildDataUnion: BuildDataUnion = async ({ cache, templates }) => {
  const templateObjects = await Promise.all(
    templates.map(
      async (template) => await cache.datasource.getTemplate({ slug: template })
    )
  );
  const types = await Promise.all(
    templateObjects.map(
      async (template) => await buildTemplateData(cache, template)
    )
  );
  return cache.build(
    new GraphQLUnionType({
      name: `${templates.join("")}DataUnion`,
      types,
    })
  );
};

type BuildInitialValuesUnion = ({
  cache,
  templates,
}: {
  cache: Cache;
  templates: string[];
}) => Promise<GraphQLUnionType>;
const buildInitialValuesUnion: BuildInitialValuesUnion = async ({
  cache,
  templates,
}) => {
  const templateObjects = await Promise.all(
    templates.map(
      async (template) => await cache.datasource.getTemplate({ slug: template })
    )
  );
  const types = await Promise.all(
    templateObjects.map(
      async (template) => await buildInitialValues(cache, template)
    )
  );
  return cache.build(
    new GraphQLUnionType({
      name: `${templates.join("")}InitialValuesUnion`,
      types,
    })
  );
};

/**
 * Builds the union which can be any one of multiple templates.
 *
 * ```graphql
 * # Example
 * union DocumentUnion = Post | Author
 * ```
 */
type BuildDocumentUnion = ({
  cache,
  section,
}: {
  cache: Cache;
  section?: string;
}) => Promise<GraphQLUnionType>;

const buildDocumentUnion: BuildDocumentUnion = async ({ cache, section }) => {
  return cache.build(
    new GraphQLUnionType({
      name: `${section ? section : ""}DocumentUnion`,
      types: await buildDocumentTypes({ cache, section }),
    })
  );
};

type BuildDocumentInput = ({
  cache,
  section,
}: {
  cache: Cache;
  section?: string;
}) => Promise<GraphQLInputObjectType>;

const buildDocumentInput: BuildDocumentInput = async ({ cache, section }) => {
  const templates = await Promise.all(
    (await cache.datasource.getTemplatesForSection(section)).map(
      async (template) => {
        const t = template;
        return await buildTemplateInput(cache, t);
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
};

export type Cache = {
  /** Pass any GraphQLType through and it will check the cache before creating a new one to avoid duplicates */
  build: <T extends GraphQLType>(gqlType: T) => T;
  datasource: DataSource;
  builder: {
    buildDocumentUnion: BuildDocumentUnion;
    buildDataUnion: BuildDataUnion;
    buildTemplateForm: BuildTemplateForm;
    buildTemplateData: BuildTemplateData;
    buildTemplateInputData: BuildTemplateInputData;
    buildInitialValues: BuildInitialValues;
    buildInitialValuesUnion: BuildInitialValuesUnion;
    buildTemplateFormFieldsUnion: BuildTemplateFormFieldsUnion;
  };
};

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

      return gqlType as any; // FIXME: not sure if it's possible, but want to just assert its a GraphQL union item
    },
    datasource: datasource,
    builder: {
      buildDocumentUnion,
      buildDataUnion,
      buildTemplateInputData,
      buildTemplateData,
      buildTemplateForm,
      buildInitialValues,
      buildInitialValuesUnion,
      buildTemplateFormFieldsUnion,
    },
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

  const documentUnion = await buildDocumentUnion({ cache });
  const documentInput = await buildDocumentInput({ cache });
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
