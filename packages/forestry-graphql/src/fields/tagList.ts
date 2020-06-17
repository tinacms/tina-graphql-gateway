import { GraphQLList, GraphQLString } from "graphql";
import { tagInput } from "../inputFields";

export type TagListField = {
  label: string;
  name: string;
  type: "tag_list";
  default: string[];
  config?: {
    required?: boolean;
  };
};

export const tag_list = ({ field }: { fmt: string; field: TagListField }) => ({
  getter: {
    type: GraphQLList(GraphQLString),
  },
  setter: {
    type: tagInput,
    resolve: () => {
      return {
        name: field.name,
        label: field.label,
        component: "tags",
      };
    },
  },
  mutator: {
    type: GraphQLList(GraphQLString),
  },
});
