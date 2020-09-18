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
        name: "FieldGroupFormField",
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

const resolvers = {
  formFieldBuilder: async (
    datasource: DataSource,
    field: FieldGroupField,
    resolveField
  ) => {
    const { ...rest } = field;

    const fields = await Promise.all(
      field.fields.map(async (f) => await resolveField(datasource, f))
    );

    return {
      ...rest,
      component: "group",
      fields,
      __typename: "FieldGroupFormField",
    };
  },
  dataFieldBuilder: async (
    datasource: DataSource,
    field: FieldGroupField,
    value,
    resolveData
  ) => {
    return await resolveData(datasource, field, value);
  },
};

export const fieldGroup = {
  builders,
  resolvers,
  getter,
};
