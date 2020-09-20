import type { Field } from "./index";
import type { DataSource } from "../datasources/datasource";
import { GraphQLString, GraphQLObjectType } from "graphql";
import type { resolveFieldType, resolveDataType } from "../graphql";
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
export type FieldGroupValue = {
  [key: string]: unknown;
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
      __typename: "FieldGroupFormField",
    };
  },
  dataFieldBuilder: async (
    datasource: DataSource,
    field: FieldGroupField,
    value: FieldGroupValue,
    resolveData: resolveDataType
  ) => {
    return await resolveData(datasource, field, value);
  },
};

export const fieldGroup = {
  builders,
  resolvers,
};
