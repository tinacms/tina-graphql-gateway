import { gql } from "../../gql";

import { assertIsBoolean, assertIsString, BuildArgs, ResolveArgs } from "../";

const typename = "BooleanField";

export const boolean = {
  build: {
    field: async ({ field, accumulator }: BuildArgs<BooleanField>) => {
      accumulator.push(gql.formField(typename));
      return gql.field({
        name: field.name,
        type: typename,
      });
    },
    initialValue: ({ field }: BuildArgs<BooleanField>) => {
      return gql.string(field.name);
    },
    value: ({ field }: BuildArgs<BooleanField>) => {
      return gql.string(field.name);
    },
    input: ({ field }: BuildArgs<BooleanField>) => {
      return gql.inputString(field.name);
    },
  },
  resolve: {
    field: ({
      field,
    }: Omit<ResolveArgs<BooleanField>, "value">): TinaBooleanField => {
      const { type, ...rest } = field;

      return {
        ...rest,
        component: "toggle",
        config: rest.config || {
          required: false,
        },
        __typename: "BooleanField",
      };
    },
    initialValue: async ({
      value,
    }: ResolveArgs<BooleanField>): Promise<string> => {
      assertIsString(value, { source: "boolean initial value" });
      return value;
    },
    value: async ({ value }: ResolveArgs<BooleanField>): Promise<string> => {
      assertIsString(value, { source: "boolean value" });
      return value;
    },
    input: async ({
      field,
      value,
    }: ResolveArgs<BooleanField>): Promise<
      { [key: string]: boolean } | false
    > => {
      try {
        assertIsBoolean(value, { source: "boolean input" });
        return { [field.name]: value };
      } catch (e) {
        return false;
      }
    },
  },
};

export type BooleanField = {
  label: string;
  name: string;
  type: "boolean";
  default?: string;
  config?: {
    required?: boolean;
  };
  __namespace: string;
};

export type TinaBooleanField = {
  label: string;
  name: string;
  component: "toggle";
  default?: string;
  config?: {
    required?: boolean;
  };
  __typename: typeof typename;
};
