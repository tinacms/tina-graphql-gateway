import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";

import { FileField } from "../datasources/datasource";
import { friendlyName } from "../util";
import { imageInput } from "./inputFields";

export const file = ({
  fmt,
  field,
  config,
}: {
  fmt: string;
  field: FileField;
  config: { rootPath: string; siteLookup: string };
}) => {
  return {
    getter: {
      type: new GraphQLObjectType({
        name: friendlyName(field.name + "_gallery_" + fmt),
        fields: {
          path: {
            type: GraphQLNonNull(GraphQLString),
            resolve: async (val) => {
              return val;
            },
          },
          absolutePath: {
            type: GraphQLString,
            resolve: async (val) => {
              return config.rootPath + val;
            },
          },
        },
      }),
    },
    setter: {
      type: imageInput,
      resolve: () => {
        return {
          name: field.name,
          label: field.label,
          component: "group",
          fields: [
            {
              name: "path",
              label: "Path",
              component: "image",
            },
          ],
        };
      },
    },
    mutator: {
      type: GraphQLString,
    },
  };
};