import type { TinaField } from "./index";
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
  fields: TinaField[];
  config?: {
    required?: boolean;
  };
};
export type TinaFieldGroupListField = {
  label: string;
  name: string;
  type: "field_group_list";
  component: "group-list";
  __typename: "FieldGroupListFormField";
  default: string;
  fields: TinaField[];
  config?: {
    required?: boolean;
  };
};

const build = {
  field: async ({
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
  value: async ({
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
const resolve = {
  field: async ({
    datasource,
    field,
    resolveField,
  }: {
    datasource: DataSource;
    field: FieldGroupListField;
    resolveField: resolveFieldType;
  }): Promise<TinaFieldGroupListField> => {
    const { ...rest } = field;

    const fields = await Promise.all(
      field.fields.map(async (f) => await resolveField(datasource, f))
    );

    return {
      ...rest,
      component: "group-list",
      fields,
      __typename: "FieldGroupListFormField",
    };
  },
  value: async ({
    datasource,
    field,
    value,
    resolveData,
  }: {
    datasource: DataSource;
    field: TinaFieldGroupListField;
    value: FieldGroupValue[];
    resolveData: resolveDataType;
  }) => {
    return await Promise.all(
      value.map(async (v: any) => await resolveData(datasource, field, v))
    );
  },
};

export const fieldGroupList = {
  resolve,
  build,
};
