import * as yup from "yup";
import { GraphQLString, GraphQLObjectType, GraphQLList } from "graphql";

import { builder } from "../../builder";

import type { Cache } from "../../cache";
import type { Field, TinaField } from "../index";
import type { DataSource } from "../../datasources/datasource";
import type { resolveFieldType, resolveDataType } from "../../resolver";

export type FieldGroupListField = {
  label: string;
  name: string;
  type: "field_group_list";
  default?: string;
  fields: Field[];
  __namespace: string;
  config?: {
    required?: boolean;
  };
};
export type TinaFieldGroupListField = {
  label: string;
  name: string;
  component: "group-list";
  __typename: string;
  default?: string;
  fields: TinaField[];
  config?: {
    required?: boolean;
  };
};

export const fieldGroupList = {
  build: {
    field: async ({
      cache,
      field,
    }: {
      cache: Cache;
      field: FieldGroupListField;
    }) => {
      return cache.build(
        new GraphQLObjectType({
          name: `${field.__namespace}${field.label}GroupListField`,
          fields: {
            name: { type: GraphQLString },
            label: { type: GraphQLString },
            component: { type: GraphQLString },
            fields: {
              // field is structural subtyping TemplateData shape
              type: await builder.documentFormFieldsUnion(cache, field),
            },
          },
        })
      );
    },
    initialValue: async ({
      cache,
      field,
    }: {
      cache: Cache;
      field: FieldGroupListField;
    }) => {
      return {
        type: GraphQLList(await builder.documentDataObject(cache, field)),
      };
    },
    value: async ({
      cache,
      field,
    }: {
      cache: Cache;
      field: FieldGroupListField;
    }) => {
      return {
        type: GraphQLList(await builder.documentDataObject(cache, field)),
      };
    },
    input: async ({
      cache,
      field,
    }: {
      cache: Cache;
      field: FieldGroupListField;
    }) => {
      return {
        type: GraphQLList(await builder.documentDataInputObject(cache, field)),
      };
    },
  },
  resolve: {
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
        __typename: `${field.__namespace}${field.label}GroupListField`,
      };
    },
    initialValue: async ({
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
    input: async ({
      datasource,
      field,
      value,
      resolveData,
      resolveDocumentInputData,
    }: {
      datasource: DataSource;
      field: FieldGroupListField;
      value: unknown;
      resolveData: resolveDataType;
      resolveDocumentInputData: any;
    }): Promise<unknown> => {
      assertIsDataArray(value);

      return await Promise.all(
        value.map(async (v) => {
          return await resolveDocumentInputData({
            data: v,
            template: field,
            datasource,
          });
        })
      );
    },
  },
};

function assertIsDataArray(
  value: unknown
): asserts value is {
  [key: string]: unknown;
}[] {
  const schema = yup.array().of(yup.object({}));
  schema.validateSync(value);
}
