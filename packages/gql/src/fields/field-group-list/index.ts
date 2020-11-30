import * as yup from "yup";
import { friendlyName } from "@forestryio/graphql-helpers";
import { gql } from "../../gql";

import { builders } from "../../builder";
import { resolver } from "../../resolver/field-resolver";
import { sequential } from "../../util";

import { BuildArgs, ResolveArgs } from "../";
import type { Field, TinaField } from "../index";

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
    }: BuildArgs<FieldGroupListField>) => {
      const typename = friendlyName(field, "GroupListField");
      const fieldsUnionName = await builders.buildTemplateOrFieldValues(
        cache,
        field,
        accumulator
      );
      accumulator.push(
        gql.formField(typename, [
          gql.fieldList({ name: "fields", type: fieldsUnionName }),
        ])
      );
      return typename;
    },
    initialValue: async ({
      cache,
      field,
      accumulator,
    }: BuildArgs<FieldGroupListField>) => {
      const initialValueName = await builders.buildTemplateOrFieldValues(
        cache,
        field,
        accumulator
      );

      return gql.fieldList({ name: field.name, type: initialValueName });
    },
    value: async ({
      cache,
      field,
      accumulator,
    }: BuildArgs<FieldGroupListField>) => {
      const name = await builders.buildTemplateOrFieldData(
        cache,
        field,
        accumulator
      );
      return gql.fieldList({
        name: field.name,
        type: friendlyName(name, "Data"),
      });
    },
    input: async ({
      cache,
      field,
      accumulator,
    }: BuildArgs<FieldGroupListField>) => {
      // return gql.inputValueList(
      //   field.name,
      //   await builder.documentDataInputObject(cache, field, false, accumulator)
      // );
    },
  },
  resolve: {
    field: async ({
      datasource,
      field,
    }: Omit<ResolveArgs<FieldGroupListField>, "value">): Promise<
      TinaFieldGroupListField
    > => {
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
    }: ResolveArgs<FieldGroupListField>) => {
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
    }: ResolveArgs<FieldGroupListField>) => {
      assertIsDataArray(value);
      return sequential(
        value,
        async (v: any) =>
          await resolver.documentDataObject({
            datasource,
            resolvedTemplate: field,
            data: v,
          })
      );
    },
    input: async ({
      datasource,
      field,
      value,
    }: ResolveArgs<FieldGroupListField>): Promise<unknown> => {
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
