import type { TinaField, Field } from "./index";
import type { DataSource } from "../datasources/datasource";
import { GraphQLString, GraphQLObjectType } from "graphql";
import Joi from "joi";
import type {
  resolveFieldType,
  resolveDataType,
  ResolvedData,
} from "../graphql";
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
export type TinaFieldGroupField = {
  label: string;
  name: string;
  component: "group";
  __typename: "FieldGroupFormField";
  default: string;
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
    return cache.build(
      new GraphQLObjectType({
        name: "FieldGroupFormField",
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
      __typename: "FieldGroupFormField",
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
  const schema = Joi.object({}).unknown();
  const { error } = schema.validate(value);
  if (error) {
    throw new Error(error.message);
  }
}

export const fieldGroup = {
  build,
  resolve,
};
