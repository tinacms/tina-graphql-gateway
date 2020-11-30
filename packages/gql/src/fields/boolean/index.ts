import { gql } from "../../gql";

import { assertIsString, BuildArgs, ResolveArgs } from "../";

const typename = "BooleanField";

export const boolean = {
  build: {
    field: async ({ accumulator }: BuildArgs<BooleanField>) => {
      accumulator.push(gql.formField(typename));
      return typename;
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
    input: async ({ value }: ResolveArgs<BooleanField>): Promise<string> => {
      assertIsString(value, { source: "boolean input" });
      return value;
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
