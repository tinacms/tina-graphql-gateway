import * as yup from "yup";
import { friendlyName } from "@forestryio/graphql-helpers";
import { gql } from "../../gql";

import { template } from "../templates";
import { sequential } from "../../util";

import { BuildArgs, ResolveArgs } from "../";
import type { Field, TinaField } from "../index";
import { fieldGroup } from "../field-group";

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
      const typename = friendlyName(field, { suffix: "GroupListField" });
      const fieldsUnionName = await template.build.fields({
        cache,
        template: field,
        accumulator,
        includeBody: false,
      });
      accumulator.push(
        gql.formField(typename, [
          gql.fieldList({ name: "fields", type: fieldsUnionName }),
        ])
      );
      return gql.field({
        name: field.name,
        type: typename,
      });
    },
    initialValue: async ({
      cache,
      field,
      accumulator,
    }: BuildArgs<FieldGroupListField>) => {
      const initialValueName = await template.build.values({
        cache,
        template: field,
        accumulator,
        includeBody: false,
        includeTemplate: false,
      });

      return gql.fieldList({ name: field.name, type: initialValueName });
    },
    value: async ({
      cache,
      field,
      accumulator,
    }: BuildArgs<FieldGroupListField>) => {
      const name = await template.build.data({
        cache,
        template: field,
        accumulator,
        includeBody: false,
      });
      return gql.fieldList({
        name: field.name,
        type: name,
      });
    },
    input: async ({
      cache,
      field,
      accumulator,
    }: BuildArgs<FieldGroupListField>) => {
      const name = await template.build.input({
        cache,
        template: field,
        accumulator,
        includeBody: false,
      });
      return gql.inputValueList(field.name, name);
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
      const t = await template.resolve.form({
        datasource,
        template: field,
        includeBody: false,
      });

      return {
        ...rest,
        ...t,
        component: "group-list",
        __typename: friendlyName(field, { suffix: "GroupListField" }),
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
          await template.resolve.values({
            datasource,
            template: field,
            data: v,
          })
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
          await template.resolve.data({
            datasource,
            template: field,
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
        return await template.resolve.input({
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
