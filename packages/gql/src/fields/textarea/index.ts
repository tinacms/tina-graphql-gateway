import { gql } from "../../gql";
import { toAst, toHTML } from "../../remark";

import type { BuildArgs, ResolveArgs } from "../";

export const textarea = {
  contentField: {
    type: "textarea" as const,
    name: "content",
    label: "Content",
    config: {
      schema: {
        format: "markdown" as const,
      },
    },
    __namespace: "",
  },
  build: {
    field: async ({ accumulator }: BuildArgs<TextareaField>) => {
      const name = "TextareaField";

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
    initialValue: ({ field }: BuildArgs<TextareaField>) => {
      return gql.string(field.name);
    },
    value: ({ field, accumulator }: BuildArgs<TextareaField>) => {
      const name = "LongTextValue";
      accumulator.push(
        gql.object({
          name,
          fields: [
            gql.field({ name: "raw", type: "String" }),
            gql.field({ name: "markdownAst", type: "JSONObject" }),
            gql.field({ name: "html", type: "String" }),
          ],
        })
      );

      return gql.field({
        name: field.name,
        type: name,
      });
    },
    input: ({ field }: BuildArgs<TextareaField>) => {
      return gql.inputString(field.name);
    },
  },
  resolve: {
    field: ({
      datasource,
      field,
    }: Omit<ResolveArgs<TextareaField>, "value">): TinaTextareaField => {
      const { type, ...rest } = field;
      return {
        ...rest,
        component: "textarea",
        config: rest.config || {
          required: false,
        },
        __typename: "TextareaField",
      };
    },
    initialValue: async ({
      value,
    }: ResolveArgs<TextareaField>): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected initial value of type ${typeof value} for resolved textarea value`
        );
      }
      return value;
    },
    value: async ({
      value,
    }: ResolveArgs<TextareaField>): Promise<{
      raw: string;
      markdownAst: string;
      html: string;
    }> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected value of type ${typeof value} for resolved textarea value`
        );
      }
      const contents = await toAst({
        contents: value,
      });
      const html = await toHTML({
        contents: value,
      });
      // const markdownAstString = JSON.stringify(contents);
      return {
        raw: value,
        markdownAst: contents,
        html: html,
      };
    },
    input: async ({ value }: ResolveArgs<TextareaField>): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected input value of type ${typeof value} for resolved textarea value`
        );
      }
      return value;
    },
  },
};

export type TextareaField = {
  label: string;
  name: string;
  type: "textarea";
  default?: string;
  config?: {
    required?: boolean;
    schema?: {
      format: "markdown" | "html";
    };
  };
  __namespace: string;
};

export type TinaTextareaField = {
  label: string;
  name: string;
  component: "textarea";
  default?: string;
  config?: {
    required?: boolean;
  };
  __typename: "TextareaField";
};
