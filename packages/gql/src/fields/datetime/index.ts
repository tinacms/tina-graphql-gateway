import { gql } from "../../gql";

import { BuildArgs, ResolveArgs, assertIsString } from "../";

const typename = "DatetimeField";

export const datetime = {
  build: {
    field: async ({ accumulator }: BuildArgs<DatetimeField>) => {
      accumulator.push(gql.formField(typename));
      return typename;
    },
    initialValue: ({ field }: BuildArgs<DatetimeField>) => {
      return gql.string(field.name);
    },
    value: ({ field }: BuildArgs<DatetimeField>) => {
      return gql.string(field.name);
    },
    input: ({ field }: BuildArgs<DatetimeField>) => {
      return gql.inputString(field.name);
    },
  },
  resolve: {
    field: ({
      field,
    }: Omit<ResolveArgs<DatetimeField>, "value">): TinaDatetimeField => {
      const { type, ...rest } = field;

      return {
        ...rest,
        component: "datetime",
        __typename: "DatetimeField",
        config: rest.config || {
          required: false,
        },
      };
    },
    initialValue: async ({
      value,
    }: ResolveArgs<DatetimeField>): Promise<string> => {
      assertIsString(value, { source: "datetime" });
      return value;
    },
    value: async ({ value }: ResolveArgs<DatetimeField>): Promise<string> => {
      assertIsString(value, { source: "datetime" });
      return "";
    },
    input: async ({ value }: ResolveArgs<DatetimeField>): Promise<string> => {
      assertIsString(value, { source: "datetime" });
      return value;
    },
  },
};

export type DatetimeField = {
  label: string;
  name: string;
  type: "datetime";
  default?: string;
  config?: {
    required?: boolean;
  };
  __namespace: string;
};

export type TinaDatetimeField = {
  label: string;
  name: string;
  component: "datetime";
  default?: string;
  config?: {
    required?: boolean;
  };
  __typename: typeof typename;
};
