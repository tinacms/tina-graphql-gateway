import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLUnionType,
  GraphQLList,
  getNamedType,
  printSchema,
  GraphQLType,
  GraphQLField,
  GraphQLFieldConfig,
  GraphQLObjectTypeConfig,
  print,
  GraphQLUnionTypeConfig,
} from "graphql";
import { queryBuilder } from "@forestryio/graphql-helpers";
import type { GraphQLOutputType, GraphQLFieldConfigMap, Thunk } from "graphql";
import { text } from "./fields/text";
import { textarea } from "./fields/textarea";
import { select } from "./fields/select";
import fs from "fs";
import { blocks } from "./fields/blocks";
import { fieldGroup } from "./fields/field-group";
import type { Template, TemplateData } from "./types";
import type { Field } from "./fields";
import type { DataSource } from "./datasources/datasource";
import type { ContextT } from "./graphql";

const buildField = async (cache: Cache, field: Field) => {
  switch (field.type) {
    case "textarea":
      return textarea.builder.setter({ cache, field });
    case "select":
      return select.builder.setter({ cache, field });
    case "blocks":
      return blocks.builder.setter({ cache, field });
    default:
      break;
  }
  return cache.build(
    new GraphQLObjectType<Field, ContextT>({
      name: field.type,
      fields: {
        name: { type: GraphQLString, resolve: (item) => item },
        component: { type: GraphQLString },
        gibberish: { type: GraphQLString },
      },
    })
  );
};

const buildFields = async (cache: Cache, template: TemplateData) => {
  return Promise.all(
    template.fields.map(async (field) => await buildField(cache, field))
  );
};

const buildTemplateFormFields = async (
  cache: Cache,
  template: TemplateData
) => {
  return cache.build(
    GraphQLList(
      new GraphQLUnionType({
        name: `${template.label}FormFields`,
        types: await buildFields(cache, template),
      })
    )
  );
};

const buildTemplateForm = async (cache: Cache, template: TemplateData) => {
  return cache.build(
    new GraphQLObjectType({
      name: `${template.label}Form`,
      fields: {
        fields: { type: await buildTemplateFormFields(cache, template) },
      },
    })
  );
};

const buildTemplateDataFields = async (
  cache: Cache,
  template: TemplateData
) => {
  const fields: GraphQLFieldConfigMap<any, ContextT> = {};

  await Promise.all(
    template.fields.map(async (field) => {
      switch (field.type) {
        case "textarea":
          fields[field.name] = textarea.builder.getter({ cache, field });
          break;
        case "select":
          fields[field.name] = await select.builder.getter({
            cache,
            field,
          });
          break;
        case "blocks":
          fields[field.name] = await blocks.builder.getter({
            cache,
            field,
          });
          break;

        default:
          fields[field.name] = { type: GraphQLString };
          break;
      }
    })
  );

  return fields;
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

type BuildFormUnion = ({
  cache,
  templates,
}: {
  cache: Cache;
  templates: string[];
}) => Promise<GraphQLUnionType>;
const buildFormUnion: BuildFormUnion = async ({ cache, templates }) => {
  const templateObjects = await Promise.all(
    templates.map(
      async (template) => await cache.datasource.getTemplate({ slug: template })
    )
  );
  const types = await Promise.all(
    templateObjects.map(
      async (template) => await buildTemplateForm(cache, template)
    )
  );
  return cache.build(
    new GraphQLUnionType({
      name: `${templates.join("")}FormUnion`,
      types,
    })
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
    buildFormUnion: BuildFormUnion;
    buildTemplateForm: any;
  };
};

export const schemaBuilder = async ({
  datasource,
}: {
  datasource: DataSource;
}) => {
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
      buildFormUnion,
      buildTemplateForm,
    },
  };

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

  await fs.writeFileSync(
    "/Users/jeffsee/code/graphql-demo/packages/gql/src/temp.gql",
    printSchema(schema)
  );
  await fs.writeFileSync(
    "/Users/jeffsee/code/graphql-demo/packages/gql/src/query.gql",
    print(queryBuilder(schema))
  );

  return schema;
};
