import { GraphQLInputObjectType, GraphQLObjectType } from "graphql";
import {
  generateFields,
  buildGroupSetter,
  WithFields,
  Templates,
  TemplatePage,
} from "..";
import { friendlyName } from "../formatFmt";

export type FieldGroupField = WithFields & {
  label: string;
  name: string;
  type: "field_group";
  config?: {
    required?: boolean;
  };
};

export const field_group = ({
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
  field: FieldGroupField;
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
    rootPath,
    sectionFmts,
    templateObjectTypes,
    templateFormObjectTypes,
    templateDataObjectTypes,
    templateInputObjectTypes,
    templatePages,
    pathToTemplates,
  });
  return {
    getter: {
      type: new GraphQLObjectType({
        name: friendlyName(field.name + "_fields_" + fmt),
        fields: getters,
      }),
    },
    setter: {
      type: buildGroupSetter({
        name: friendlyName(field.name + "_fields_list_" + fmt + "_config"),
        setters: setters,
        field,
      }),
      resolve: (value: any) => {
        return value;
      },
    },
    mutator: {
      type: new GraphQLInputObjectType({
        name: friendlyName(field.name + "_fields_" + fmt + "_input"),
        fields: mutators,
      }),
    },
  };
};
