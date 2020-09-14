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

const getter = ({
  value,
  field,
  datasource,
}: {
  value: string;
  field?: SelectField;
  datasource: any;
}) => {
  const args = { path: value };
  const template = datasource.getTemplateForDocument(args);

  return {
    ...datasource.getData(args),
    _template: template.label,
    _fields: {
      data: { type: "field-group", fields: template.fields },
      content: { type: "textarea", name: "content", label: "Content" },
    },
  };
};

// @ts-ignore
const builder = ({
  schemaSource,
  cache,
  field,
}: {
  schemaSource: any;
  cache: any;
  field: SelectField;
}) => {
  const t = schemaSource.getTemplate(field.label);
  return {
    type: cache.findOrBuildObjectType({
      name: t.label,
      fields: {
        content: { type: GraphQLString },
        data: {
          type: cache.findOrBuildObjectType({
            name: `${t.label}data`,
            fields: {
              name: { type: GraphQLString },
            },
          }),
        },
      },
    }),
  };
};

export const select = {
  getter,
  builder,
};
