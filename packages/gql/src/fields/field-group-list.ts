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

export type FieldGroupListField = {
  label: string;
  name: string;
  type: "field_group_list";
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
  field: FieldGroupListField;
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
    field: FieldGroupListField;
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
    field: FieldGroupListField;
  }) => {
    return {
      type: GraphQLList(await cache.builder.buildTemplateData(cache, field)),
    };
  },
};
const resolvers = {
  formFieldBuilder: async (
    datasource: DataSource,
    field: FieldGroupListField,
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
      __typename: "FieldGroupListFormField",
    };
  },
  dataFieldBuilder: async (
    datasource: DataSource,
    field: FieldGroupListField,
    value,
    resolveData
  ) => {
    return await Promise.all(
      value.map(async (v) => await resolveData(datasource, field, v))
    );
  },
};

export const fieldGroupList = {
  getter,
  resolvers,
  builders,
};
