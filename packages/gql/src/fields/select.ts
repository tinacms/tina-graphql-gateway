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

const builders = {
  /** Returns one of 3 possible types of select options */
  formFieldBuilder: ({
    cache,
    field,
  }: {
    cache: Cache;
    field: SelectField;
  }) => {
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
  dataFieldBuilder: async ({
    cache,
    field,
  }: {
    cache: Cache;
    field: SelectField;
  }) => {
    let select;
    switch (field.config.source.type) {
      case "documents":
        select = field as DocumentSelect;
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
        select = field as SimpleSelect;
        return { type: GraphQLString };
    }
  },
};

const resolvers = {
  formFieldBuilder: async (datasource: DataSource, field: SelectField) => {
    let select;
    const f = {
      ...field,
      component: "select",
      __typename: "SelectFormField",
    };
    switch (field.config.source.type) {
      case "documents":
        select = field as DocumentSelect;
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
  dataFieldBuilder: async (
    datasource: DataSource,
    field: SelectField,
    value: string
  ) => {
    let select;
    switch (field.config.source.type) {
      case "documents":
        select = field as DocumentSelect;
        throw new Error(`document select not implemented`);
      case "pages":
        return {
          _resolver: "_initial_source",
          _args: { path: value },
        };
      case "simple":
        select = field as SimpleSelect;
        return value;
    }
  },
};

export const select = {
  resolvers,
  builders,
};
