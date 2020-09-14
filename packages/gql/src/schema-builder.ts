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

const buildSectionTemplate = async ({
  schemaSource,
  cache,
  field,
}: {
  schemaSource: schemaSource;
  cache: { [key: string]: any };
  field: any;
}) => {
  if (field.type === "blocks") {
    // const templateSlugs = await schemaSource.getTemplate({ slug: "section" });
    // console.log(templateSlugs);
    const templates = await Promise.all(
      field.template_types.map(
        async (slug: string) => await schemaSource.getTemplate({ slug })
      )
    );
    return {
      type: GraphQLList(
        new GraphQLUnionType({
          name: "SectionDataUnion",
          types: await buildSectionTemplates({
            schemaSource,
            cache,
            templates,
            sectionSlug: "section",
            dataOnly: true,
          }),
        })
      ),
    };
  } else if (field.type === "select") {
    return {
      type: new GraphQLUnionType({
        name: "AuthorUnion",
        types: await buildSectionTemplates({
          schemaSource,
          cache,
          sectionSlug: "author",
        }),
      }),
    };
  } else if (field.type === "textarea") {
    return text.builder({ field });
  }

  throw new Error(`Unable to find field type ${field.type}`);
};

const buildSectionTemplates = async ({
  schemaSource,
  cache,
  templates,
  sectionSlug,
  dataOnly,
}: {
  schemaSource: schemaSource;
  cache: { [key: string]: any };
  templates?: Template[];
  sectionSlug?: string;
  dataOnly?: boolean;
}) => {
  // @ts-ignore
  const sectionTemplates =
    templates || (await schemaSource.getTemplatesForSection(sectionSlug));

  return Promise.all(
    sectionTemplates.map(async (sectionTemplate) => {
      const fields: { [key: string]: { type: any } } = {};
      await Promise.all(
        sectionTemplate.fields.map(async (field) => {
          fields[field.name] = await buildSectionTemplate({
            schemaSource,
            cache,
            field,
          });
        })
      );
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
    })
  );
};

export const schemaBuilder = async ({
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
            types: await buildSectionTemplates({ schemaSource, cache }),
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
