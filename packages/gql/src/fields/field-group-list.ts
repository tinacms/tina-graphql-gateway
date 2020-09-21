import type { TinaField, Field } from "./index";
import type { DataSource } from "../datasources/datasource";
import { GraphQLString, GraphQLObjectType, GraphQLList } from "graphql";
import type { resolveFieldType, resolveDataType } from "../graphql";
import type { Cache } from "../schema-builder";
import Joi from "joi";

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
export type TinaFieldGroupListField = {
  label: string;
  name: string;
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
    const { type, ...rest } = field;

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
    field: FieldGroupListField;
    value: unknown;
    resolveData: resolveDataType;
  }) => {
    assertIsDataArray(value);
    return await Promise.all(
      value.map(async (v: any) => await resolveData(datasource, field, v))
    );
  },
};

function assertIsDataArray(
  value: unknown
): asserts value is {
  [key: string]: unknown;
}[] {
  const schema = Joi.array().items(Joi.object({}).unknown());
  const { error } = schema.validate(value);
  if (error) {
    throw new Error(error.message);
  }
}

export const fieldGroupList = {
  resolve,
  build,
};
