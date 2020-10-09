import { GraphQLString, GraphQLObjectType, GraphQLList } from "graphql";

import { builder } from "../../builder";

import type { DataSource } from "../../datasources/datasource";
import type { Cache } from "../../cache";

export const select = {
  build: {
    /** Returns one of 3 possible types of select options */
    field: ({ cache, field }: { cache: Cache; field: SelectField }) => {
      return cache.build(
        new GraphQLObjectType({
          name: "SelectField",
          fields: {
            name: { type: GraphQLString },
            label: { type: GraphQLString },
            component: { type: GraphQLString },
            options: { type: GraphQLList(GraphQLString) },
          },
        })
      );
    },
    initialValue: async ({
      cache,
      field,
    }: {
      cache: Cache;
      field: SelectField;
    }) => {
      return { type: GraphQLString };
    },
    value: async ({ cache, field }: { cache: Cache; field: SelectField }) => {
      let select;
      switch (field.config.source.type) {
        case "documents":
          throw new Error(`document select not implemented`);
        case "pages":
          select = field as SectionSelect;
          return {
            type: await cache.build(
              new GraphQLObjectType({
                name: `${select.name}_Document`,
                fields: {
                  document: {
                    type: await builder.documentUnion({
                      cache,
                      section: select.config.source.section,
                    }),
                  },
                },
              })
            ),
          };
        case "simple":
          return { type: GraphQLString };
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
