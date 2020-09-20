import type { DataSource } from "../datasources/datasource";
import { GraphQLString, GraphQLObjectType, GraphQLList } from "graphql";
import type { Cache } from "../schema-builder";

export type BaseSelectField = {
  label: string;
  name: string;
  type: "select";
};
export type DocumentSelect = BaseSelectField & {
  config: {
    required: boolean;
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
    required: boolean;
    source: {
      type: "pages";
      section: string;
    };
  };
};
export type SimpleSelect = BaseSelectField & {
  default: string;
  options: string[];
  config: {
    options: string[];
    required: boolean;
    source: {
      type: "simple";
    };
  };
};

export type SelectField = SimpleSelect | SectionSelect | DocumentSelect;

const build = {
  /** Returns one of 3 possible types of select options */
  field: ({ cache, field }: { cache: Cache; field: SelectField }) => {
    return cache.build(
      new GraphQLObjectType({
        name: "SelectFormField",
        fields: {
          name: { type: GraphQLString },
          label: { type: GraphQLString },
          component: { type: GraphQLString },
          options: { type: GraphQLList(GraphQLString) },
        },
      })
    );
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
              name: `${select.label}Document`,
              fields: {
                document: {
                  type: await cache.builder.buildDocumentUnion({
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
};

const resolve = {
  field: async ({
    datasource,
    field,
  }: {
    datasource: DataSource;
    field: SelectField;
  }) => {
    let select;
    const f = {
      ...field,
      component: "select",
      __typename: "SelectFormField",
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
  value: async ({
    datasource,
    field,
    value,
  }: {
    datasource: DataSource;
    field: SelectField;
    value: string;
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
};

export const select = {
  resolve,
  build,
};
