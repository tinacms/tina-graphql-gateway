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
  GraphQLUnionTypeConfig,
} from "graphql";
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
): Promise<GraphQLFieldConfigMap<any, ContextT>> => {
  const fields: { [key: string]: GraphQLFieldConfig<any, ContextT> } = {};

  await Promise.all(
    template.fields.map(async (field) => {
      fields[field.name] = { type: GraphQLString };
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

const buildDocumentTypes = async (
  cache: Cache
): Promise<GraphQLObjectType<any, any>[]> => {
  return Promise.all(
    (await cache.datasource.getTemplatesForSection()).map(
      async (template) => await buildTemplate(cache, template)
    )
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
const buildDocumentUnion = async (cache: Cache): Promise<GraphQLUnionType> => {
  return cache.build(
    new GraphQLUnionType({
      name: "DocumentUnion",
      types: await buildDocumentTypes(cache),
    })
  );
};

type Cache = {
  /** Pass any GraphQLType through and it will check the cache before creating a new one to avoid duplicates */
  build: <T extends GraphQLType>(gqlType: T) => T;
  datasource: DataSource;
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
  };

  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "Query",
      fields: {
        document: {
          args: {
            path: { type: GraphQLNonNull(GraphQLString) },
          },
          type: await buildDocumentUnion(cache),
        },
      },
    }),
  });

  await fs.writeFileSync(
    "/Users/jeffsee/code/graphql-demo/packages/gql/src/temp.gql",
    printSchema(schema)
  );

  return schema;
};
