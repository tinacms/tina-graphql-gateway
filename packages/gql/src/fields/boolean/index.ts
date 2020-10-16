import { gql } from "../../gql";

import type { BuildArgs, ResolveArgs } from "../";

export const boolean = {
  build: {
    field: async ({ accumulator }: BuildArgs<BooleanField>) => {
      const name = "BooleanField";

      accumulator.push(
        gql.object({
          name,
          fields: [
            gql.string("name"),
            gql.string("label"),
            gql.string("component"),
          ],
        })
      );

      return name;
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
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected initial value of type ${typeof value} for resolved text value`
        );
      }
      return value;
    },
    value: async ({ value }: ResolveArgs<BooleanField>): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected value of type ${typeof value} for resolved text value`
        );
      }
      return value;
    },
    input: async ({ value }: ResolveArgs<BooleanField>): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected input value of type ${typeof value} for resolved text value`
        );
      }
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
  __typename: "BooleanField";
};
