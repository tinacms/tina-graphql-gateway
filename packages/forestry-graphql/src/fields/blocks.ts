import {
  GraphQLList,
  GraphQLUnionType,
  GraphQLObjectType,
  GraphQLInputObjectType,
} from "graphql";
import { baseInputFields } from "../inputFields";
import { friendlyName, getFMTFilename } from "../formatFmt";
import { arrayToObject } from "../utils";

export type BlocksField = {
  label: string;
  name: string;
  type: "blocks";
  template_types: string[];
  config?: {
    min: string;
    max: string;
  };
};
export const blocks = ({
  field,
  templateFormObjectTypes,
  templateDataObjectTypes,
  templateInputObjectTypes,
  pathToTemplates,
}: {
  fmt: string;
  field: BlocksField;
  pathToTemplates: string;
  templateInputObjectTypes: {
    [key: string]: GraphQLInputObjectType;
  };
  templateDataObjectTypes: { [key: string]: GraphQLObjectType };
  templateFormObjectTypes: { [key: string]: GraphQLObjectType };
}) => {
  return {
    getter: {
      type: GraphQLList(
        new GraphQLUnionType({
          name: friendlyName(field.name + "_union"),
          types: () => {
            return field.template_types.map(
              (template) => templateDataObjectTypes[template]
            );
          },
          resolveType: (val) => {
            return templateDataObjectTypes[val.template];
          },
        })
      ),
    },
    setter: {
      type: new GraphQLObjectType({
        name: friendlyName(field.name + "_fieldConfig"),
        fields: {
          ...baseInputFields,
          templates: {
            type: new GraphQLObjectType({
              name: friendlyName(field.name + "_templates"),
              fields: () => {
                return arrayToObject(
                  field.template_types.map(
                    (template) => templateFormObjectTypes[template]
                  ),
                  (obj, item) => {
                    obj[item.name] = {
                      type: item,
                      resolve: (val: any) => val,
                    };
                  }
                );
              },
            }),
          },
        },
      }),
      resolve: async (value: { [key: string]: {} }) => {
        return {
          ...field,
          value: value[field.name],
          component: field.type,
          templates: arrayToObject(field.template_types, (obj, item) => {
            obj[item] = { name: item };
          }),
        };
      },
    },
    mutator: {
      type: GraphQLList(
        new GraphQLInputObjectType({
          name: friendlyName(field.name + "_input"),
          fields: () => {
            return arrayToObject(field.template_types, (obj, item) => {
              obj[friendlyName(item) + "_input"] = {
                type:
                  templateInputObjectTypes[
                    getFMTFilename(item, pathToTemplates)
                  ],
              };
            });
          },
        })
      ),
    },
  };
};
