import { GraphQLString, GraphQLObjectType, GraphQLList } from "graphql";
import { friendlyName } from "@forestryio/graphql-helpers";
import { gql } from "../../gql";

import { builder } from "../../builder/ast-builder";

import type { DataSource } from "../../datasources/datasource";
import type { Cache } from "../../cache";
import type { Definitions } from "../../builder/ast-builder";

export const select = {
  build: {
    /** Returns one of 3 possible types of select options */
    field: async ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: SelectField;
      accumulator: Definitions[];
    }) => {
      accumulator.push({
        kind: "ObjectTypeDefinition",
        name: {
          kind: "Name",
          value: "SelectField",
        },
        interfaces: [],
        directives: [],
        fields: [
          gql.string("name"),
          gql.string("label"),
          gql.string("component"),
          gql.string("options", { list: true }),
        ],
      });

      return "SelectField";
    },
    initialValue: async ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: SelectField;
      accumulator: Definitions[];
    }) => {
      return gql.string(field.name);
    },
    value: async ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: SelectField;
      accumulator: Definitions[];
    }) => {
      let select;
      switch (field.config.source.type) {
        case "documents":
          throw new Error(`document select not implemented`);
        case "pages":
          select = field as SectionSelect;

          const fieldUnionName = await builder.documentUnion({
            cache,
            section: select.config.source.section,
            accumulator,
          });

          return {
            kind: "FieldDefinition",
            name: {
              kind: "Name",
              value: field.name,
            },
            arguments: [],
            type: {
              kind: "NamedType",
              name: {
                kind: "Name",
                value: fieldUnionName,
              },
            },
            directives: [],
          };
        case "simple":
          return gql.string(field.name);
      }
    },
    input: async ({ cache, field }: { cache: Cache; field: SelectField }) => {
      return GraphQLString;
    },
  },
  resolve: {
    field: async ({
      datasource,
      field,
    }: {
      datasource: DataSource;
      field: SelectField;
    }): Promise<TinaSelectField> => {
      let select;
      const { type, ...rest } = field;
      const f = {
        ...rest,
        component: "select" as const,
        __typename: "SelectField",
      };
      switch (field.config.source.type) {
        case "documents":
          throw new Error(`document select not implemented`);
        case "pages":
          select = field as SectionSelect;
          return {
            ...f,
            options: await datasource.getDocumentsForSection(
              select.config.source.section
            ),
          };
        case "simple":
          select = field as SimpleSelect;
          return {
            ...f,
            options: select.config.options,
          };
      }
    },
    initialValue: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: SelectField;
      value: unknown;
    }) => {
      return value;
    },
    value: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: SelectField;
      value: unknown;
    }) => {
      switch (field.config.source.type) {
        case "documents":
          throw new Error(`document select not implemented`);
        case "pages":
          return {
            _resolver: "_resource",
            _resolver_kind: "_nested_source",
            _args: { path: value },
          };
        case "simple":
          return value;
      }
    },
    input: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: SelectField;
      value: unknown;
    }) => {
      switch (field.config.source.type) {
        case "documents":
          throw new Error(`document select not implemented`);
        case "pages":
          // TODO: validate the document exists
          return value;
        // TODO: validate the item is in the options list
        case "simple":
          return value;
      }
    },
  },
};

export type BaseSelectField = {
  label: string;
  name: string;
  type: "select";
};
type DocumentSelect = BaseSelectField & {
  config: {
    required?: boolean;
    source: {
      type: "documents";
      section: string;
      file: string;
      path: string;
    };
  };
};
export type SectionSelect = BaseSelectField & {
  config: {
    required?: boolean;
    source: {
      type: "pages";
      section: string;
    };
  };
};

export type SimpleSelect = BaseSelectField & {
  default?: string;
  config: {
    options: string[];
    required?: boolean;
    source: {
      type: "simple";
    };
  };
};

export type SelectField = SimpleSelect | SectionSelect | DocumentSelect;
export type TinaSelectField = {
  label: string;
  name: string;
  component: "select";
  options: string[];
};
