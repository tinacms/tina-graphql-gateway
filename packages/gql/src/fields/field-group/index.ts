import { GraphQLString, GraphQLNonNull, GraphQLObjectType } from "graphql";
import { friendlyName } from "@forestryio/graphql-helpers";
import * as yup from "yup";
import { gql } from "../../gql";

import { builder } from "../../builder/ast-builder";
import { resolver } from "../../resolver/field-resolver";

import type { Cache } from "../../cache";
import type { Field, TinaField } from "../index";
import type { DataSource } from "../../datasources/datasource";
import type { Definitions } from "../../builder/ast-builder";

export const fieldGroup = {
  build: {
    field: async ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: FieldGroupField;
      accumulator: Definitions[];
    }) => {
      const name = friendlyName(field, "GroupField");

      // accumulator.push({
      //   kind: "ObjectTypeDefinition",
      //   name: {
      //     kind: "Name",
      //     value: name,
      //   },
      //   interfaces: [],
      //   directives: [],
      //   fields: [],
      // });

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
              kind: "NamedType",
              name: {
                kind: "Name",
                value: fieldsUnionName,
              },
            },
            directives: [],
          },
        ],
      });

      return name;

      // return await cache.build(
      //   friendlyName(field, "GroupField"),
      //   async () =>
      //     new GraphQLObjectType({
      //       name: friendlyName(field, "GroupField"),
      //       fields: {
      //         name: { type: GraphQLString },
      //         label: { type: GraphQLString },
      //         component: { type: GraphQLString },
      //         fields: {
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
      field: FieldGroupField;
    }) => {
      return {
        kind: "FieldDefinition" as const,
        name: {
          kind: "Name" as const,
          value: field.name,
        },
        arguments: [],
        type: {
          kind: "NamedType" as const,
          name: {
            kind: "Name" as const,
            value: "String",
          },
        },
        directives: [],
      };
      // return {
      //   type: await builder.documentInitialValuesObject(cache, field),
      // };
    },
    value: async ({
      cache,
      field,
    }: {
      cache: Cache;
      field: FieldGroupField;
    }) => {
      return gql.string(field.name);
      // return { type: await builder.documentDataObject(cache, field) };
    },
    input: async ({
      cache,
      field,
    }: {
      cache: Cache;
      field: FieldGroupField;
    }) => {
      // return await builder.documentDataInputObject(cache, field);
    },
  },
  resolve: {
    field: async ({
      datasource,
      field,
    }: {
      datasource: DataSource;
      field: FieldGroupField;
    }): Promise<TinaFieldGroupField> => {
      const { type, ...rest } = field;
      const template = await resolver.documentFormObject(datasource, field);

      return {
        ...rest,
        ...template,
        component: "group",
        __typename: friendlyName(field, "GroupField"),
      };
    },
    initialValue: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: FieldGroupField;
      value: unknown;
    }) => {
      assertIsData(value);
      return await resolver.documentInitialValuesObject(
        datasource,
        field,
        value
      );
    },
    value: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: FieldGroupField;
      value: unknown;
    }) => {
      assertIsData(value);
      return await resolver.documentDataObject(datasource, field, value);
    },
    input: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: FieldGroupField;
      value: unknown;
    }) => {
      assertIsData(value);
      return await resolver.documentDataInputObject({
        data: value,
        template: field,
        datasource,
      });
    },
  },
};

function assertIsData(
  value: unknown
): asserts value is {
  [key: string]: unknown;
} {
  const schema = yup.object({}).required();
  schema.validateSync(value);
}

/**
 * The Forestry definition for Field Group
 *
 * ```yaml
 * label: Some Name
 * name: some-name
 * type: field_group
 * fields:
 *   - label: Some nested field
 *     name: my-field
 *     type: Text
 * ```
 */
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
