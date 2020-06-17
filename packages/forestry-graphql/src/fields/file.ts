import { GraphQLObjectType, GraphQLNonNull, GraphQLString } from "graphql";
import { friendlyName } from "../plugins";
import { imageInput } from "../inputFields";

export type FileField = {
  label: string;
  name: string;
  type: "file";
  config?: {
    required?: boolean;
    maxSize: null | number;
  };
};

export const file = ({
  fmt,
  field,
  rootPath,
}: {
  fmt: string;
  field: FileField;
  rootPath: string;
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
            type: GraphQLNonNull(GraphQLString),
            resolve: async (val) => {
              return rootPath + val;
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
          component: "file",
        };
      },
    },
    mutator: {
      type: GraphQLString,
    },
  };
};
