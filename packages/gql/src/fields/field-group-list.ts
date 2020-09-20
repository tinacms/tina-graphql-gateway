import type { Field } from "./index";
import type { DataSource } from "../datasources/datasource";
import { GraphQLString, GraphQLObjectType, GraphQLList } from "graphql";
import type { resolveFieldType, resolveDataType } from "../graphql";
import type { Cache } from "../schema-builder";
import type { FieldGroupValue } from "./field-group";

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
    resolveField: resolveFieldType
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
    value: FieldGroupValue[],
    resolveData: resolveDataType
  ) => {
    return await Promise.all(
      value.map(async (v: any) => await resolveData(datasource, field, v))
    );
  },
};

export const fieldGroupList = {
  resolvers,
  builders,
};
