import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";

import { GalleryField } from "../datasources/datasource";
import { configType } from "./types";
import { friendlyName } from "../util";
import { imageInput } from "./inputFields";

export const generateImageGalleryObjectType = (
  name: string,
  config: configType
): GraphQLObjectType => {
  return new GraphQLObjectType({
    name,
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
  });
};

export const image_gallery = ({
  fmt,
  field,
  config,
}: {
  fmt: string;
  field: GalleryField;
  config: { rootPath: string; siteLookup: string }; // TODO: make this better
}) => {
  return {
    getter: {
      type: GraphQLList(
        generateImageGalleryObjectType(
          friendlyName(field.name + "_gallery_" + fmt),
          config
        )
      ),
    },
    setter: {
      type: imageInput,
      resolve: () => {
        return {
          name: field.name,
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
      type: GraphQLList(GraphQLString),
    },
  };
};
