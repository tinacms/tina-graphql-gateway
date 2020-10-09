import * as yup from "yup";
import { GraphQLString, GraphQLObjectType, GraphQLList } from "graphql";

import { builder } from "../../builder";
import { resolver } from "../../resolver/field-resolver";

import type { Cache } from "../../cache";
import type { Field, TinaField } from "../index";
import type { DataSource } from "../../datasources/datasource";

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
          name: `${field.__namespace}_${field.name}_GroupListField`,
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
      return GraphQLList(await builder.documentDataInputObject(cache, field));
    },
  },
  resolve: {
    field: async ({
      datasource,
      field,
    }: {
      datasource: DataSource;
      field: FieldGroupListField;
    }): Promise<TinaFieldGroupListField> => {
      const { type, ...rest } = field;
      const template = await resolver.documentFormObject(datasource, field);

      return {
        ...rest,
        ...template,
        component: "group-list",
        __typename: `${field.__namespace}_${field.name}_GroupListField`,
      };
    },
    initialValue: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: FieldGroupListField;
      value: unknown;
    }) => {
      assertIsDataArray(value);
      return await Promise.all(
        value.map(
          async (v: any) =>
            await resolver.documentInitialValuesObject(datasource, field, v)
        )
      );
    },
    value: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: FieldGroupListField;
      value: unknown;
    }) => {
      assertIsDataArray(value);
      return await Promise.all(
        value.map(
          async (v: any) =>
            await resolver.documentDataObject(datasource, field, v)
        )
      );
    },
    input: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: FieldGroupListField;
      value: unknown;
    }): Promise<unknown> => {
      assertIsDataArray(value);

      return await Promise.all(
        value.map(async (v) => {
          return await resolver.documentDataInputObject({
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
