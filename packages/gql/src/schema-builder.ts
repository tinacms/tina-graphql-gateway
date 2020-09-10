import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLUnionType,
  GraphQLList,
} from "graphql";
import type { GraphQLFieldConfigMap, Thunk } from "graphql";
import type { Template } from "./datasource";

type schemaSource = {
  getTemplates: () => Template[];
  getTemplate: (label: string) => Template;
};

const buildSectionTemplates = ({
  schemaSource,
  cache,
}: {
  schemaSource: schemaSource;
  cache: { [key: string]: any };
}) => {
  const sectionTemplates = schemaSource.getTemplates();

  return sectionTemplates.map((sectionTemplate) => {
    const fields: { [key: string]: { type: any } } = {};
    sectionTemplate.fields.forEach((field) => {
      if (field.type === "blocks") {
        const template = schemaSource.getTemplate(field.label);
        fields[field.name] = {
          type: GraphQLList(
            cache.findOrBuildObjectType({
              name: template.label,
              fields: {
                description: { type: GraphQLString },
              },
            })
          ),
        };
      } else if (field.type === "select") {
        const template = schemaSource.getTemplate(field.label);
        fields[field.name] = {
          type: cache.findOrBuildObjectType({
            name: template.label,
            fields: {
              data: {
                type: cache.findOrBuildObjectType({
                  name: `${template.label}data`,
                  fields: {
                    name: { type: GraphQLString },
                  },
                }),
              },
            },
          }),
        };
      } else {
        fields[field.name] = { type: GraphQLString };
      }
    });

    return cache.findOrBuildObjectType({
      name: sectionTemplate.label,
      fields: {
        content: { type: GraphQLString },
        data: {
          type: cache.findOrBuildObjectType({
            name: `${sectionTemplate.label}data`,
            fields,
          }),
        },
      },
    });
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

  return new GraphQLSchema({
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
};
