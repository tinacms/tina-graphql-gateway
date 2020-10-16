import { gql } from "../../gql";

import { BuildArgs, ResolveArgs } from "../";

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
      return gql.string(field.name);
    },
    value: ({ field }: BuildArgs<TagListField>) => {
      return gql.string(field.name);
    },
    input: ({ field }: BuildArgs<TagListField>) => {
      return gql.inputString(field.name);
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
    }: ResolveArgs<TagListField>): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected initial value of type ${typeof value} for resolved tag_list value`
        );
      }
      return value;
    },
    value: async ({ value }: ResolveArgs<TagListField>): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected value of type ${typeof value} for resolved tag_list value`
        );
      }
      return value;
    },
    input: async ({ value }: ResolveArgs<TagListField>): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected input value of type ${typeof value} for resolved tag_list value`
        );
      }
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
