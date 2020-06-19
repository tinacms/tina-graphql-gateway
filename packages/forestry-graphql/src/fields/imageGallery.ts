import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
} from "graphql";
import { imageInput } from "../inputFields";
import { friendlyName } from "../formatFmt";

export type GalleryField = {
  label: string;
  name: string;
  type: "image_gallery";
  config: {
    required?: boolean;
    maxSize: null | number;
  };
};

export const image_gallery = ({
  fmt,
  field,
  rootPath,
}: {
  fmt: string;
  field: GalleryField;
  rootPath: string;
}) => {
  return {
    getter: {
      type: GraphQLList(
        new GraphQLObjectType({
          name: friendlyName(field.name + "_gallery_" + fmt),
          fields: {
            path: {
              type: GraphQLNonNull(GraphQLString),
              resolve: async (val) => {
                return val;
              },
            },
            absolutePath: {
              type: GraphQLNonNull(GraphQLString),
              resolve: async (val) => {
                return rootPath + val;
              },
            },
          },
        })
      ),
    },
    setter: {
      type: imageInput,
      resolve: () => {
        return {
          name: field.name,
          component: "image",
        };
      },
    },
    mutator: {
      type: GraphQLList(GraphQLString),
    },
  };
};
