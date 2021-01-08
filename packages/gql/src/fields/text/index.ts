import { gql } from "../../gql";

import { assertIsString, BuildArgs, ResolveArgs } from "../";

const typename = "TextField";
export const text = {
  build: {
    field: async ({ field, accumulator }: BuildArgs<TextField>) => {
      accumulator.push(gql.formField(typename));
      return gql.field({
        name: field.name,
        type: typename,
      });
    },
    initialValue: ({ field }: BuildArgs<TextField>) => {
      return gql.string(field.name);
    },
    value: ({ field }: BuildArgs<TextField>) => {
      return gql.string(field.name);
    },
    input: ({ field }: BuildArgs<TextField>) => {
      return gql.inputString(field.name);
    },
  },
  resolve: {
    field: ({
      field,
    }: Omit<ResolveArgs<TextField>, "value">): TinaTextField => {
      const { type, ...rest } = field;
      return {
        ...rest,
        component: "text",
        config: rest.config || {
          required: false,
        },
        __typename: "TextField",
      };
    },
    initialValue: async ({
      value,
    }: ResolveArgs<TextField>): Promise<string> => {
      assertIsString(value, { source: "text initial value" });
      return value;
    },
    value: async ({ value }: ResolveArgs<TextField>): Promise<string> => {
      assertIsString(value, { source: "text value" });
      return value;
    },
    input: async ({
      field,
      value,
    }: ResolveArgs<TextField>): Promise<{ [key: string]: string } | false> => {
      try {
        assertIsString(value, { source: "text input" });
        return { [field.name]: value };
      } catch (e) {
        return false;
      }
    },
  },
};

export type TextField = {
  label: string;
  name: string;
  type: "text";
  default?: string;
  config?: {
    required?: boolean;
  };
  __namespace: string;
};

export type TinaTextField = {
  label: string;
  name: string;
  component: "text";
  default?: string;
  config?: {
    required?: boolean;
  };
  __typename: typeof typename;
};
