import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLUnionType,
  GraphQLList,
  printSchema,
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
  value: { [key: string]: any }[];
  field: SelectField;
  datasource: any;
}) => {
  return value.map((value) => {
    const template = datasource.getTemplate({ slug: value.template });
    const fields: { [key: string]: any } = {};
    template.fields.forEach((field: any) => (fields[field.name] = field));

    return {
      _fields: fields,
      ...value,
    };
  });
};

const builder = ({ schemaSource, cache, field }) => {
  const template = schemaSource.getTemplate(field.label);
  console.log(template);
  return {
    type: GraphQLList(
      cache.findOrBuildObjectType({
        name: template.label,
        fields: {
          description: { type: GraphQLString },
        },
      })
    ),
  };
};

export const blocks = {
  getter,
  builder,
};
