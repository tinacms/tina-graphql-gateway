import * as yup from "yup";
import { friendlyName } from "@forestryio/graphql-helpers";
import { GraphQLString, GraphQLObjectType, GraphQLList } from "graphql";
import { gql } from "../../gql";

import { builder } from "../../builder/ast-builder";
import { resolver } from "../../resolver/field-resolver";
import { sequential } from "../../util";

import type { Cache } from "../../cache";
import type { Field, TinaField } from "../index";
import type { DataSource } from "../../datasources/datasource";
import type { Definitions } from "../../builder/ast-builder";

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
      accumulator,
    }: {
      cache: Cache;
      field: FieldGroupListField;
      accumulator: Definitions[];
    }) => {
      const name = friendlyName(field, "GroupListField");

      const fieldsUnionName = await builder.documentFormFieldsUnion(
        cache,
        field,
        accumulator
      );

      accumulator.push({
        kind: "ObjectTypeDefinition",
        name: {
          kind: "Name",
          value: name,
        },
        interfaces: [],
        directives: [],
        fields: [
          gql.string("name"),
          gql.string("label"),
          gql.string("component"),
          {
            kind: "FieldDefinition",
            name: {
              kind: "Name",
              value: "fields",
            },
            arguments: [],
            type: {
              kind: "ListType",
              type: {
                kind: "NamedType",
                name: {
                  kind: "Name",
                  value: fieldsUnionName,
                },
              },
            },
            directives: [],
          },
        ],
      });

      return name;
      // return await cache.build(
      //   friendlyName(field, "GroupListField"),
      //   async () =>
      //     new GraphQLObjectType({
      //       name: friendlyName(field, "GroupListField"),
      //       fields: {
      //         name: { type: GraphQLString },
      //         label: { type: GraphQLString },
      //         component: { type: GraphQLString },
      //         fields: {
      //           // field is structural subtyping TemplateData shape
      //           type: await builder.documentFormFieldsUnion(cache, field),
      //         },
      //       },
      //     })
      // );
    },
    initialValue: async ({
      cache,
      field,
    }: {
      cache: Cache;
      field: FieldGroupListField;
    }) => {
      return gql.string(field.name, { list: true });
      // return {
      //   type: GraphQLList(await builder.documentDataObject(cache, field)),
      // };
    },
    value: async ({
      cache,
      field,
    }: {
      cache: Cache;
      field: FieldGroupListField;
    }) => {
      return gql.string(field.name, { list: true });

      // return {
      //   type: GraphQLList(await builder.documentDataObject(cache, field)),
      // };
    },
    input: async ({
      cache,
      field,
    }: {
      cache: Cache;
      field: FieldGroupListField;
    }) => {
      // return GraphQLList(await builder.documentDataInputObject(cache, field));
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
        __typename: friendlyName(field, "GroupListField"),
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
      return sequential(
        value,
        async (v: any) =>
          await resolver.documentInitialValuesObject(datasource, field, v)
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
      return sequential(
        value,
        async (v: any) =>
          await resolver.documentDataObject(datasource, field, v)
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

      return sequential(value, async (v) => {
        return await resolver.documentDataInputObject({
          data: v,
          template: field,
          datasource,
        });
      });
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
