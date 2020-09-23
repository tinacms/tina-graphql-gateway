import { GraphQLString, GraphQLObjectType, getNamedType } from "graphql";
import * as yup from "yup";
import type {
  resolveFieldType,
  resolveDataType,
  ResolvedData,
} from "../../graphql";
import type { TinaField, Field } from "../index";
import type { DataSource } from "../../datasources/datasource";
import type { Cache } from "../../schema-builder";

export type FieldGroupField = {
  label: string;
  name: string;
  type: "field_group";
  default?: string;
  fields: Field[];
  config?: {
    required?: boolean;
  };
  __namespace: string;
};
export type TinaFieldGroupField = {
  label: string;
  name: string;
  component: "group";
  __typename: string;
  default?: string;
  fields: TinaField[];
  config?: {
    required?: boolean;
  };
};
export type FieldGroupValue = {
  [key: string]: unknown;
};

const build = {
  field: async ({ cache, field }: { cache: Cache; field: FieldGroupField }) => {
    const union = await cache.builder.buildTemplateFormFieldsUnion(
      cache,
      field
    );
    return cache.build(
      new GraphQLObjectType({
        name: `${field.__namespace}${field.label}GroupField`,
        fields: {
          name: { type: GraphQLString },
          label: { type: GraphQLString },
          component: { type: GraphQLString },
          fields: {
            type: union,
          },
        },
      })
    );
  },
  value: async ({ cache, field }: { cache: Cache; field: FieldGroupField }) => {
    return { type: await cache.builder.buildTemplateData(cache, field) };
  },
};

const resolve = {
  field: async ({
    datasource,
    field,
    resolveField,
  }: {
    datasource: DataSource;
    field: FieldGroupField;
    resolveField: resolveFieldType;
  }): Promise<TinaFieldGroupField> => {
    const { type, ...rest } = field;

    const fields = await Promise.all(
      field.fields.map(async (f) => await resolveField(datasource, f))
    );

    return {
      ...rest,
      component: "group",
      fields,
      __typename: `${field.__namespace}${field.label}GroupField`,
    };
  },
  value: async ({
    datasource,
    field,
    value,
    resolveData,
  }: {
    datasource: DataSource;
    field: FieldGroupField;
    value: unknown;
    resolveData: resolveDataType;
  }): Promise<ResolvedData> => {
    assertIsData(value);
    return await resolveData(datasource, field, value);
  },
};

function assertIsData(
  value: unknown
): asserts value is {
  [key: string]: unknown;
} {
  const schema = yup.object({});
  schema.validateSync(value);
}

export const fieldGroup = {
  build,
  resolve,
};
