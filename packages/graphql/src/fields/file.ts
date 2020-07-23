import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";

import { ConfigType } from "./types";
import { FileField } from "../datasources/datasource";
import { friendlyName } from "../util";
import { imageInputType } from "./inputTypes";

export const file = ({
  fmt,
  field,
  config,
}: {
  fmt: string;
  field: FileField;
  config: ConfigType;
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
      type: imageInputType,
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
