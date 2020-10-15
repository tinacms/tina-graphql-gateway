import { GraphQLString, GraphQLObjectType } from "graphql";
import { gql } from "../../gql";
import mdx from "@forestryio/mdx";

import type { Cache } from "../../cache";
import type { DataSource } from "../../datasources/datasource";
import type { Definitions } from "../../builder/ast-builder";

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
    field: async ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: TextareaField;
      accumulator: Definitions[];
    }) => {
      accumulator.push({
        kind: "ObjectTypeDefinition",
        name: {
          kind: "Name",
          value: "TextareaField",
        },
        interfaces: [],
        directives: [],
        fields: [
          gql.string("name"),
          gql.string("label"),
          gql.string("component"),
        ],
      });

      return "TextareaField";
    },
    initialValue: ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: TextareaField;
      accumulator: Definitions[];
    }) => {
      return gql.string(field.name);
    },
    value: ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: TextareaField;
      accumulator: Definitions[];
    }) => {
      accumulator.push({
        kind: "ObjectTypeDefinition",
        name: {
          kind: "Name",
          value: "LongTextValue",
        },
        fields: [
          {
            kind: "FieldDefinition",
            name: {
              kind: "Name",
              value: "raw",
            },
            type: {
              kind: "NamedType",
              name: {
                kind: "Name",
                value: "String",
              },
            },
          },
          {
            kind: "FieldDefinition",
            name: {
              kind: "Name",
              value: "markdownAst",
            },
            type: {
              kind: "NamedType",
              name: {
                kind: "Name",
                value: "String",
              },
            },
          },
          {
            kind: "FieldDefinition",
            name: {
              kind: "Name",
              value: "html",
            },
            type: {
              kind: "NamedType",
              name: {
                kind: "Name",
                value: "String",
              },
            },
          },
        ],
      });
      return {
        kind: "FieldDefinition" as const,
        name: {
          kind: "Name" as const,
          value: field.name,
        },
        type: {
          kind: "NamedType" as const,
          name: {
            kind: "Name" as const,
            value: "LongTextValue" as const,
          },
        },
      };
    },
    input: ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: TextareaField;
      accumulator: Definitions[];
    }) => {
      return gql.inputString(field.name);
    },
  },
  resolve: {
    field: ({
      datasource,
      field,
    }: {
      datasource: DataSource;
      field: TextareaField;
    }): TinaTextareaField => {
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
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: TextareaField;
      value: unknown;
    }): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected initial value of type ${typeof value} for resolved textarea value`
        );
      }
      return value;
    },
    value: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: TextareaField;
      value: unknown;
    }): Promise<
      | string
      | { raw: string; markdownAst: string }
      | { _value: string; field: TextareaField }
    > => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected value of type ${typeof value} for resolved textarea value`
        );
      }
      const contents = await mdx.mdCompile({
        contents: value,
      });
      const markdownAstString = JSON.stringify(contents);
      return {
        raw: value,
        markdownAst: markdownAstString,
      };
    },
    input: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: TextareaField;
      value: unknown;
    }): Promise<string> => {
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
