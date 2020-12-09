import { gql } from "../../gql";

import { BuildArgs, ResolveArgs, assertIsNumber } from "../";

const typename = "NumberField";

export const number = {
  build: {
    field: async ({ field, accumulator }: BuildArgs<NumberField>) => {
      accumulator.push(gql.formField(typename));
      return gql.field({
        name: field.name,
        type: typename,
      });
    },
    initialValue: ({ field }: BuildArgs<NumberField>) => {
      return gql.number(field.name);
    },
    value: ({ field }: BuildArgs<NumberField>) => {
      return gql.number(field.name);
    },
    input: ({ field }: BuildArgs<NumberField>) => {
      return gql.inputNumber(field.name);
    },
  },
  resolve: {
    field: ({
      field,
    }: Omit<ResolveArgs<NumberField>, "value">): TinaNumberField => {
      const { type, ...rest } = field;
      return {
        ...rest,
        component: "number",
        config: rest.config || {
          required: false,
        },
        __typename: typename,
      };
    },
    initialValue: async ({
      value,
    }: ResolveArgs<NumberField>): Promise<number> => {
      assertIsNumber(value, { source: "number field initial value" });
      return value;
    },
    value: async ({ value }: ResolveArgs<NumberField>): Promise<number> => {
      assertIsNumber(value, { source: "number field value" });
      console.log("its a number", value);
      return value;
    },
    input: async ({ value }: ResolveArgs<NumberField>): Promise<number> => {
      assertIsNumber(value, { source: "number field input" });
      return value;
    },
  },
};

export type NumberField = {
  label: string;
  name: string;
  type: "number";
  default?: string;
  config?: {
    required?: boolean;
  };
  __namespace: string;
};

export type TinaNumberField = {
  label: string;
  name: string;
  component: "number";
  default?: string;
  config?: {
    required?: boolean;
  };
  __typename: typeof typename;
};
