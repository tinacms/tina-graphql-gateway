import {
  WithFields,
  generateFields,
  Templates,
  TemplatePage,
  buildGroupSetter,
} from "..";
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLInputObjectType,
} from "graphql";
import { friendlyName } from "../plugins";

export type FieldGroupListField = WithFields & {
  label: string;
  name: string;
  type: "field_group_list";
  config?: {
    required?: boolean;
  };
};

export const field_group_list = ({
  fmt,
  field,
  rootPath,
  sectionFmts,
  templateObjectTypes,
  templateFormObjectTypes,
  templateDataObjectTypes,
  templateInputObjectTypes,
  templatePages,
  pathToTemplates,
}: {
  fmt: string;
  field: FieldGroupListField;
  rootPath: string;
  sectionFmts: {
    name: string;
    templates: string[];
  }[];
  templateObjectTypes: Templates;
  templatePages: TemplatePage[];
  templateInputObjectTypes: {
    [key: string]: GraphQLInputObjectType;
  };
  templateDataObjectTypes: { [key: string]: GraphQLObjectType };
  templateFormObjectTypes: { [key: string]: GraphQLObjectType };
  pathToTemplates: string;
}) => {
  const { getters, setters, mutators } = generateFields({
    fmt: `${fmt}_${field.name}`,
    fields: field.fields,
    rootPath: rootPath,
    templatePages,
    sectionFmts,
    templateObjectTypes,
    templateFormObjectTypes,
    templateDataObjectTypes,
    templateInputObjectTypes,
    pathToTemplates,
  });
  return {
    getter: {
      type: GraphQLList(
        new GraphQLObjectType({
          name: friendlyName(field.name + "_fields_list_" + fmt),
          fields: getters,
        })
      ),
    },
    setter: {
      type: buildGroupSetter({
        name: friendlyName(field.name + "_fields_list_" + fmt + "_config"),
        setters,
        field,
      }),
      resolve: (value: any) => {
        return value;
      },
    },
    mutator: {
      type: GraphQLList(
        new GraphQLInputObjectType({
          name: friendlyName(field.name + "_fields_list_" + fmt + "_input"),
          fields: mutators,
        })
      ),
    },
  };
};
