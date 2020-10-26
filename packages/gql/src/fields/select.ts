import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLUnionType,
  GraphQLList,
} from "graphql";

export type SelectField = {
  label: string;
  name: string;
  type: "select";
  default: string;
  config?: {
    required?: boolean;
  };
};

const getter = async ({
  value,
  field,
  datasource,
}: {
  value: string;
  field?: SelectField;
  datasource: any;
}) => {
  const args = { path: value };
  const template = await datasource.getTemplateForDocument(args);

  return {
    ...(await datasource.getData(args)),
    _template: template.label,
    _fields: {
      data: { type: "field-group", fields: template.fields },
      content: { type: "textarea", name: "content", label: "Content" },
    },
  };
};

export const select = {
  getter,
};
