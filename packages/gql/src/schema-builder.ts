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
import { select } from "./fields/select";
import fs from "fs";
import { blocks } from "./fields/blocks";
import { fieldGroup } from "./fields/field-group";
import type { Template } from "./datasources/datasource";

type schemaSource = {
  getTemplates: (slug: string | undefined) => Template[];
};

const buildSectionTemplate = ({
  schemaSource,
  cache,
  field,
}: {
  schemaSource: schemaSource;
  cache: { [key: string]: any };
  field: any;
}) => {
  if (field.type === "blocks") {
    console.log(field);
    return {
      type: GraphQLList(
        new GraphQLUnionType({
          name: "SectionDataUnion",
          types: buildSectionTemplates({
            schemaSource,
            cache,
            sectionSlug: "Section",
            dataOnly: true,
          }),
        })
      ),
    };
  } else if (field.type === "select") {
    return {
      type: new GraphQLUnionType({
        name: "AuthorUnion",
        types: buildSectionTemplates({
          schemaSource,
          cache,
          sectionSlug: "Author",
        }),
      }),
    };
  } else if (field.type === "textarea") {
    return text.builder({ field });
  }

  throw new Error(`Unable to find field type ${field.type}`);
};

const buildSectionTemplates = ({
  schemaSource,
  cache,
  sectionSlug,
  dataOnly,
}: {
  schemaSource: schemaSource;
  cache: { [key: string]: any };
  sectionSlug?: string;
  dataOnly?: boolean;
}) => {
  // @ts-ignore
  const sectionTemplates = schemaSource.getTemplates(sectionSlug);

  return sectionTemplates.map((sectionTemplate) => {
    const fields: { [key: string]: { type: any } } = {};
    sectionTemplate.fields.forEach((field) => {
      fields[field.name] = buildSectionTemplate({
        schemaSource,
        cache,
        field,
      });
    });
    const dataType = cache.findOrBuildObjectType({
      name: `${sectionTemplate.label}Data`,
      fields,
    });
    if (dataOnly) {
      return dataType;
    } else {
      return cache.findOrBuildObjectType({
        name: sectionTemplate.label,
        fields: {
          // Every document has this shape
          // https://www.notion.so/Content-Data-defaults-f08b05f147c240858880546e660125c3
          content: { type: GraphQLString },
          data: {
            type: dataType,
          },
        },
      });
    }
  });
};

export const schemaBuilder = ({
  schemaSource,
}: {
  schemaSource: schemaSource;
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
  };

  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "Query",
      fields: {
        document: {
          args: {
            path: { type: GraphQLNonNull(GraphQLString) },
          },
          type: new GraphQLUnionType({
            name: "DocumentUnion",
            types: buildSectionTemplates({ schemaSource, cache }),
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
