import { gql } from "../../gql";
import { toAst, toHTML } from "../../remark";

import { assertIsString, BuildArgs, ResolveArgs } from "../";

const typename = "TextareaField";

export const textarea = {
  contentField: {
    type: "textarea" as const,
    name: "_body",
    label: "Content",
    config: {
      schema: {
        format: "markdown" as const,
      },
    },
    __namespace: "",
  },
  build: {
    field: async ({ field, accumulator }: BuildArgs<TextareaField>) => {
      accumulator.push(gql.formField(typename));
      return gql.field({
        name: field.name,
        type: typename,
      });
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
      field,
    }: Omit<ResolveArgs<TextareaField>, "value">): TinaTextareaField => {
      const { type, ...rest } = field;
      return {
        ...rest,
        component: "textarea",
        config: rest.config || {
          required: false,
        },
        __typename: typename,
      };
    },
    initialValue: async ({
      value,
    }: ResolveArgs<TextareaField>): Promise<string> => {
      assertIsString(value, { source: "textarea initial value" });
      return value;
    },
    value: async ({
      value,
    }: ResolveArgs<TextareaField>): Promise<{
      raw: string;
      markdownAst: string;
      html: string;
    }> => {
      assertIsString(value, { source: "textarea initial value" });
      const contents = await toAst({
        contents: value,
      });
      const html = await toHTML({
        contents: value,
      });
      return {
        raw: value,
        markdownAst: contents,
        html: html,
      };
    },
    input: async ({ value }: ResolveArgs<TextareaField>): Promise<string> => {
      assertIsString(value, { source: "textarea initial value" });
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
  __typename: typeof typename;
};
