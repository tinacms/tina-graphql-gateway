/**
Copyright 2021 Forestry.io Inc
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { gql } from "../../gql";
import { toAst, toHTML } from "../../remark";

import { assertIsString, BuildArgs, ResolveArgs } from "../";
import { friendlyName } from "@forestryio/graphql-helpers";
import { assertShape } from "../../util";

const typename = "TextareaField";

export const textarea = {
  contentField: {
    type: "textarea" as const,
    name: "_body",
    label: "Body",
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
      return gql.FieldDefinition({
        name: field.name,
        type: typename,
      });
    },
    initialValue: ({ field, accumulator }: BuildArgs<TextareaField>) => {
      const name = "LongTextInitialValue";
      accumulator.push(
        gql.ObjectTypeDefinition({
          name,
          fields: [
            gql.FieldDefinition({ name: "raw", type: gql.TYPES.String }),
            // TODO: Not sure how to support custom scalars, might be better to
            // force this into a recursive GraphQLObject which matches the
            // remark AST shape
            // gql.FieldDefinition({ name: "markdownAst", type: "JSONObject" }),
            // gql.FieldDefinition({ name: "html", type: gql.TYPES.String }),
          ],
        })
      );

      return gql.FieldDefinition({
        name: field.name,
        type: name,
      });
    },
    value: ({ field, accumulator }: BuildArgs<TextareaField>) => {
      const name = "LongTextValue";
      accumulator.push(
        gql.ObjectTypeDefinition({
          name,
          fields: [
            gql.FieldDefinition({ name: "raw", type: gql.TYPES.String }),
            gql.FieldDefinition({ name: "markdownAst", type: "JSONObject" }),
            gql.FieldDefinition({ name: "html", type: gql.TYPES.String }),
          ],
        })
      );

      return gql.FieldDefinition({
        name: field.name,
        type: name,
      });
    },
    input: async ({ field, cache, accumulator }: BuildArgs<TextareaField>) => {
      const name = friendlyName(field, { suffix: "LongTextInput" });
      accumulator.push(
        gql.InputObjectTypeDefinition({
          name,
          fields: [gql.inputString("raw")],
        })
      );

      return gql.InputValueDefinition({ name: field.name, type: name });
    },
  },
  resolve: {
    field: ({
      field,
    }: Omit<ResolveArgs<TextareaField>, "value">): TinaTextareaField => {
      const { type, ...rest } = field;
      return {
        ...rest,
        name: `${field.name}.raw`,
        component: "textarea",
        config: rest.config || {
          required: false,
        },
        __typename: typename,
      };
    },
    initialValue: async ({
      value,
    }: ResolveArgs<TextareaField>): Promise<{
      raw: string;
    }> => {
      assertIsString(value, { source: "textarea initial value" });
      return {
        raw: value,
      };
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
    input: async ({
      field,
      value,
    }: ResolveArgs<TextareaField>): Promise<
      { [key: string]: string } | false
    > => {
      try {
        assertShape<{ raw: string }>(value, (yup) =>
          yup.object({ raw: yup.string().required() })
        );
        return { [field.name]: value.raw };
      } catch (e) {
        return false;
      }
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
