import { gql } from "../../gql";

import { assertIsString, BuildArgs, ResolveArgs } from "../";

const typename = "FileField";

export const file = {
  build: {
    field: async ({ field, accumulator }: BuildArgs<FileField>) => {
      accumulator.push(gql.formField(typename));
      return gql.field({
        name: field.name,
        type: typename,
      });
    },
    initialValue: ({ field }: BuildArgs<FileField>) => {
      return gql.string(field.name);
    },
    value: ({ field }: BuildArgs<FileField>) => {
      return gql.string(field.name);
    },
    input: ({ field }: BuildArgs<FileField>) => {
      return gql.inputString(field.name);
    },
  },
  resolve: {
    field: ({
      field,
    }: Omit<ResolveArgs<FileField>, "value">): TinaFileField => {
      const { type, ...rest } = field;
      return {
        ...rest,
        component: "image",
        __typename: typename,
        config: rest.config || {
          required: false,
        },
      };
    },
    initialValue: async ({
      value,
    }: ResolveArgs<FileField>): Promise<string> => {
      assertIsString(value, { source: "file initial value" });
      return value;
    },
    value: async ({ value }: ResolveArgs<FileField>): Promise<string> => {
      assertIsString(value, { source: "file value" });
      return value;
    },
    input: async ({
      field,
      value,
    }: ResolveArgs<FileField>): Promise<{ [key: string]: string } | false> => {
      try {
        assertIsString(value, { source: "file input" });
        return { [field.name]: value };
      } catch (e) {
        return false;
      }
    },
  },
};

export type FileField = {
  label: string;
  name: string;
  type: "file";
  default?: string;
  config?: {
    required?: boolean;
  };
  __namespace: string;
};

export type TinaFileField = {
  label: string;
  name: string;
  component: "image";
  default?: string;
  config?: {
    required?: boolean;
  };
  __typename: typeof typename;
};
