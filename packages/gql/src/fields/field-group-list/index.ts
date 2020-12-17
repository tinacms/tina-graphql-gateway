import * as yup from "yup";
import { friendlyName } from "@forestryio/graphql-helpers";
import { gql } from "../../gql";

import { builders } from "../../builder";
import { resolver } from "../../resolver";
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
      const typename = friendlyName(field, "GroupListField");
      const fieldsUnionName = await builders.buildTemplateOrFieldFormFields(
        cache,
        field,
        accumulator,
        false
      );
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
      const initialValueName = await builders.buildTemplateOrFieldValues(
        cache,
        field,
        accumulator,
        false,
        false
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
        accumulator,
        false
      );
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
      const name = await builders.buildTemplateOrFieldInput(
        cache,
        field,
        accumulator,
        false
      );
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
      const template = await resolver.form({
        datasource,
        template: field,
        includeBody: false,
      });

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
          await resolver.values({ datasource, template: field, data: v })
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
          await resolver.data({
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
        return await resolver.input({
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
