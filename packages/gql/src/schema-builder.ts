import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLUnionType,
  GraphQLList,
  getNamedType,
  GraphQLType,
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
import type { ContextT } from "./graphql";

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
        name: `${template.label}FormFields`,
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
  return cache.build(
    new GraphQLObjectType({
      name: `${template.label}Form`,
      fields: {
        fields: { type: await buildTemplateFormFieldsUnion(cache, template) },
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
      async (template) => await buildTemplate(cache, template)
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
      description: "This is a test",
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

export type Cache = {
  /** Pass any GraphQLType through and it will check the cache before creating a new one to avoid duplicates */
  build: <T extends GraphQLType>(gqlType: T) => T;
  datasource: DataSource;
  builder: {
    buildDocumentUnion: BuildDocumentUnion;
    buildDataUnion: BuildDataUnion;
    buildTemplateForm: BuildTemplateForm;
    buildTemplateData: BuildTemplateData;
    buildTemplateFormFieldsUnion: BuildTemplateFormFieldsUnion;
  };
};

export const cacheInit = (datasource: DataSource) => {
  const storage: {
    [key: string]: GraphQLType;
  } = {};
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
      buildTemplateData,
      buildTemplateForm,
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
  const cache = cacheInit(datasource);

  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "Query",
      fields: {
        document: {
          args: {
            path: { type: GraphQLNonNull(GraphQLString) },
          },
          type: await buildDocumentUnion({ cache }),
        },
      },
    }),
  });

  return schema;
};
