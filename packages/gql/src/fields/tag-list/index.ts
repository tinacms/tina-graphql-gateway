import { gql } from "../../gql";

import {
  BuildArgs,
  ResolveArgs,
  assertIsStringArray,
  assertIsString,
} from "../";

export const tag_list = {
  build: {
    field: async ({ accumulator }: BuildArgs<TagListField>) => {
      const name = "TagListField";
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
    initialValue: ({ field }: BuildArgs<TagListField>) => {
      return gql.stringList(field.name);
    },
    value: ({ field }: BuildArgs<TagListField>) => {
      return gql.stringList(field.name);
    },
    input: ({ field }: BuildArgs<TagListField>) => {
      return gql.inputValueList(field.name, "String");
    },
  },
  resolve: {
    field: ({
      field,
    }: Omit<ResolveArgs<TagListField>, "value">): TinaTagListField => {
      const { type, ...rest } = field;
      return {
        ...rest,
        component: "tags",
        config: rest.config || {
          required: false,
        },
        __typename: "TagListField",
      };
    },
    initialValue: async ({
      value,
    }: ResolveArgs<TagListField>): Promise<string[]> => {
      assertIsStringArray(value, { source: "tag value" });
      return value;
    },
    value: async ({ value }: ResolveArgs<TagListField>): Promise<string[]> => {
      assertIsStringArray(value, { source: "tag value" });
      return value;
    },
    input: async ({ value }: ResolveArgs<TagListField>): Promise<string[]> => {
      assertIsStringArray(value, { source: "tag value" });
      return value;
    },
  },
};

export type TagListField = {
  label: string;
  name: string;
  type: "tag_list";
  default?: string;
  config?: {
    required?: boolean;
  };
  __namespace: string;
};

export type TinaTagListField = {
  label: string;
  name: string;
  component: "tags";
  default?: string;
  config?: {
    required?: boolean;
  };
  __typename: "TagListField";
};
