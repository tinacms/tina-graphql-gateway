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

const buildSectionTemplate = async ({
  datasource,
  cache,
  field,
}: {
  datasource: DataSource;
  cache: { [key: string]: any };
  field: Field;
}) => {
  if (field.type === "blocks") {
    const templates = await Promise.all(
      field.template_types.map(
        async (slug) => await datasource.getTemplate({ slug })
      )
    );
    return {
      type: GraphQLList(
        new GraphQLUnionType({
          name: "SectionDataUnion",
          types: await buildSectionTemplates({
            datasource,
            cache,
            templates,
            sectionSlug: "section",
          }),
        })
      ),
    };
  } else if (field.type === "select") {
    return {
      type: new GraphQLUnionType({
        name: "AuthorUnion",
        types: await buildSectionTemplates({
          datasource,
          cache,
          sectionSlug: "author",
        }),
      }),
    };
  } else if (field.type === "textarea") {
    return textarea.builder({ field });
  } else if (field.type === "text") {
    return text.builder({ field });
  }
  throw new Error(
    `Tried assigning with ${field.type}, This might not be implemented yet`
  );
};

const buildSectionTemplates = async ({
  datasource,
  cache,
  templates,
  sectionSlug,
}: {
  datasource: DataSource;
  cache: { [key: string]: any };
  templates?: TemplateData[];
  sectionSlug?: string;
  dataOnly?: boolean;
}) => {
  const sectionTemplates = !templates
    ? await datasource.getTemplatesForSection(sectionSlug)
    : templates;

  if (!sectionTemplates) {
    throw new Error(`No section templates found for section ${sectionSlug}`);
  }

  return Promise.all(
    sectionTemplates.map(async (sectionTemplate) => {
      const fields: { [key: string]: any } = {};
      await Promise.all(
        sectionTemplate.fields.map(async (field) => {
          fields[field.name] = await buildSectionTemplate({
            datasource,
            cache,
            field,
          });
        })
      );
      const dataType = cache.findOrBuildObjectType({
        name: `${sectionTemplate.label}Data`,
        fields,
      });
      return cache.findOrBuildObjectType({
        name: sectionTemplate.label,
        fields: {
          form: {
            type: cache.findOrBuildObjectType({
              name: "Form",
              fields: {
                fields: {
                  type: GraphQLList(
                    new GraphQLUnionType({
                      name: "FieldsUnion" + sectionTemplate.label,
                      types: [
                        cache.findOrBuildObjectType({
                          name: "textarea",
                          fields: {
                            name: { type: GraphQLString },
                            label: { type: GraphQLString },
                            description: { type: GraphQLString },
                            component: { type: GraphQLString },
                          },
                        }),
                      ],
                    })
                  ),
                },
              },
            }),
          },
          // Every document has this shape
          // https://www.notion.so/Content-Data-defaults-f08b05f147c240858880546e660125c3
          content: { type: GraphQLString },
          data: {
            type: dataType,
          },
        },
      });
    })
  );
};

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
            types: await buildSectionTemplates({ datasource, cache }),
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
