import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLUnionType,
  GraphQLList,
  printSchema,
  GraphQLType,
  GraphQLField,
  GraphQLFieldConfig,
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
    field.type,
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

const buildTemplateFormFields = async (
  cache: Cache,
  template: TemplateData
) => {
  return cache.build(
    `${template.label}FormFields`,
    GraphQLList(
      new GraphQLUnionType({
        name: `${template.label}FormFields`,
        types: await Promise.all(
          template.fields.map(async (field) => await buildField(cache, field))
        ),
      })
    )
  );
};

const buildTemplateForm = async (cache: Cache, template: TemplateData) => {
  return cache.build(
    `${template.label}Form`,
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
    `${template.label}Data`,
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
    template.label,
    new GraphQLObjectType({
      name: template.label,
      fields: {
        form: { type: await buildTemplateForm(cache, template) },
        data: { type: await buildTemplateData(cache, template) },
      },
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
const buildDocumentUnion = async (cache: Cache): Promise<GraphQLUnionType> => {
  return new GraphQLUnionType({
    name: "DocumentUnion",
    types: await Promise.all(
      (await cache.datasource.getTemplatesForSection()).map(
        async (template) => await buildTemplate(cache, template)
      )
    ),
  });
};

type Cache = {
  build: (name: string, gqlType: GraphQLType) => GraphQLType;
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
    build: (name, gqlType) => {
      if (storage[name]) {
        return storage[name];
      } else {
        storage[name] = gqlType;
        return storage[name];
      }
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
