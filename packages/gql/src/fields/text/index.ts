import { gql } from "../../gql";

import { BuildArgs, ResolveArgs } from "../";

export const text = {
  build: {
    field: async ({ accumulator }: BuildArgs<TextField>) => {
      const name = "TextField";
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
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected initial value of type ${typeof value} for resolved text value`
        );
      }
      return value;
    },
    value: async ({ value }: ResolveArgs<TextField>): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected value of type ${typeof value} for resolved text value`
        );
      }
      return value;
    },
    input: async ({ value }: ResolveArgs<TextField>): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected input value of type ${typeof value} for resolved text value`
        );
      }
      return value;
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
  __typename: "TextField";
};
