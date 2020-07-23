import { GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";

import { TagListField } from "../datasources/datasource";
import { baseInputFields } from "./inputTypes";

export const tag_list = ({ field }: { fmt: string; field: TagListField }) => ({
  getter: {
    // TODO: If a tag list is set to required, does that mean it needs to exist, or does it mean it can't be empty?
    type: GraphQLList(GraphQLString),
  },
  setter: {
    type: tagInputType,
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

export const tagInputType = new GraphQLObjectType<TagListField>({
  name: "TagsFormField",
  fields: {
    ...baseInputFields,
  },
});
