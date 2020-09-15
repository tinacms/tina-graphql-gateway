import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLUnionType,
  GraphQLList,
  printSchema,
} from "graphql";
import type { GraphQLFieldConfigMap, Thunk } from "graphql";
import { text } from "./fields/text";
import { textarea } from "./fields/textarea";
import { select } from "./fields/select";
import fs from "fs";
import { blocks } from "./fields/blocks";
import { fieldGroup } from "./fields/field-group";
import type { Template, TemplateData } from "./types";
import type { Field } from "./fields";
import type { DataSource } from "./datasources/datasource";

const buildTemplateField = (cache, field) => {
  switch (field.type) {
    case 'text':
      text.builder(cache, field)
      break;

    default:
      break;
  }
}

const buildTemplateFields = (cache, fields) => {
  const fieldTypes = {}
  fields.forEach(field => {
    fieldTypes[field.name] => buildTemplateField(cache, field)
  })
}

const buildTemplateForm = (cache, fields) => {
  return new GraphQLObjectType({
    name: '',
    fields: {
      fields: buildTemplateFields(cache, fields)
    }
  })
}

const buildTemplateData = (cache, fields) => {
  const fieldTypes = {}
  fields.forEach(field => {
    fieldTypes[field.name] => buildDataField(cache, field)
  })
}

const buildTemplateType = (cache, template) => {
  return new GraphQLObjectType({
    name: `${template.label}`,
    fields: {
      form: buildTemplateForm(),
      content: "",
      data: buildTemplateData()
    }
  })
}

const buildDocumentUnion = (cache) => {
  return new GraphQLUnionType({
    name: "DocumentUnion",
    types: cache.sectionTemplates.map(template => buildTemplateType(cache, template))
  })
}

export const schemaBuilder = async ({
  datasource,
}: {
  datasource: DataSource;
}) => {
  const storage: { [key: string]: any } = {};
  const cache = {
    findOrBuildObjectType: ({
      name,
      fields,
    }: {
      name: string;
      fields: Thunk<GraphQLFieldConfigMap<any, any>>;
    }) => {
      if (storage[name]) {
        return storage[name];
      }

      storage[name] = new GraphQLObjectType({
        name,
        fields,
      });

      return storage[name];
    },
    findOrBuildUnionType: ({
      name,
      types,
    }: {
      name: string;
      types: Thunk<GraphQLObjectType<any, any>[]>;
    }) => {
      if (storage[name]) {
        return storage[name];
      }

      storage[name] = new GraphQLUnionType({
        name,
        types,
      });

      return storage[name];
    },
  };

  const schema = new GraphQLSchema({
    query: cache.findOrBuildObjectType({
      name: "Query",
      fields: {
        document: {
          args: {
            path: { type: GraphQLNonNull(GraphQLString) },
          },
          type: cache.findOrBuildUnionType({
            name: "DocumentUnion",
            types: buildDocumentUnion(cache)
          }),
        },
      },
    }),
  });

  fs.writeFile(
    "/Users/jeffsee/code/graphql-demo/packages/gql/src/temp.gql",
    printSchema(schema),
    () => {}
  );

  return schema;
};
