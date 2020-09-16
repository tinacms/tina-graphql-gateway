import type { Field } from "./index";
import type { DataSource, DocumentArgs } from "../datasources/datasource";
import {
  GraphQLString,
  GraphQLObjectType,
  getNamedType,
  GraphQLList,
  GraphQLUnionType,
} from "graphql";
import type { Cache } from "../schema-builder";

export type FieldGroupField = {
  label: string;
  name: string;
  type: "field_group";
  default: string;
  fields: Field[];
  config?: {
    required?: boolean;
  };
};

type FieldMap = { [key: string]: Field };
const getter = ({
  value,
  field,
  datasource,
}: {
  value: { [key: string]: any }[];
  field: FieldGroupField;
  datasource: DataSource;
}): { _fields: FieldMap; [key: string]: unknown } => {
  const fields: FieldMap = {};
  field.fields.forEach((field) => (fields[field.name] = field));

  return {
    _fields: fields,
    ...value,
  };
};
const builders = {
  formFieldBuilder: async ({
    cache,
    field,
  }: {
    cache: Cache;
    field: FieldGroupField;
  }) => {
    return cache.build(
      new GraphQLObjectType({
        name: "FieldGroupListFormField",
        fields: {
          name: { type: GraphQLString },
          label: { type: GraphQLString },
          type: { type: GraphQLString },
          component: { type: GraphQLString },
          fields: {
            // field is structural subtyping TemplateData shape
            type: await cache.builder.buildTemplateFormFieldsUnion(
              cache,
              field
            ),
          },
        },
      })
    );
  },
  dataFieldBuilder: async ({
    cache,
    field,
  }: {
    cache: Cache;
    field: FieldGroupField;
  }) => {
    return { type: await cache.builder.buildTemplateData(cache, field) };
  },
};

export const fieldGroup = {
  builders,
  getter,
};
