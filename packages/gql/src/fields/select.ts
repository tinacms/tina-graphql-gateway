import type { Field } from "./index";
import type { DataSource, DocumentArgs } from "../datasources/datasource";
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLUnionType,
} from "graphql";
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
      file: string;
      path: string;
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
          type: await cache.builder.buildDocumentUnion({
            cache,
            section: select.config.source.section,
          }),
        };
      case "simple":
        select = field as SimpleSelect;
        return { type: GraphQLString };
    }
  },
};

const getter = async ({
  value,
  field,
  datasource,
}: {
  value: string;
  field?: SelectField;
  datasource: DataSource;
}) => {
  const args = { path: value };
  const template = await datasource.getTemplateForDocument(args);

  return {
    ...(await datasource.getData(args)),
    _template: template.label,
    _fields: {
      data: { type: "field-group", fields: template.fields },
      content: { type: "textarea", name: "content", label: "Content" },
    },
  };
};

const resolvers = {
  optionsFetcher: async (datasource: DataSource, field: SelectField) => {
    // This could show the display name of other pages if provided: {value: string, label: string}
    let options: string[] = [];
    let select;
    switch (field.config.source.type) {
      case "documents":
        select = field as DocumentSelect;
        throw new Error(`document select not implemented`);
      case "pages":
        select = field as SectionSelect;
        const pages = await datasource.getDocumentsForSection(
          select.config.source.section
        );
        options = pages;
        break;
      case "simple":
        select = field as SimpleSelect;
        options = select.options;
        break;
    }

    return options;
  },
  formFieldBuilder: async (datasource: DataSource, field: SelectField) => {
    // This could show the display name of other pages if provided: {value: string, label: string}
    let options: string[] = [];
    let select;
    switch (field.config.source.type) {
      case "documents":
        select = field as DocumentSelect;
        throw new Error(`document select not implemented`);
      case "pages":
        select = field as SectionSelect;
        const pages = await datasource.getDocumentsForSection(
          select.config.source.section
        );
        options = pages;
        return {
          ...field,
          component: "select",
          options: {
            field,
            _resolver: "select_form",
          },
          __typename: "SelectFormField",
        };
      case "simple":
        select = field as SimpleSelect;
        options = select.config.options;
        return {
          ...field,
          component: "select",
          options,
          __typename: "SelectFormField",
        };
    }
  },
  dataFieldBuilder: async (
    datasource: DataSource,
    field: SelectField,
    value
  ) => {
    let select;
    switch (field.config.source.type) {
      case "documents":
        select = field as DocumentSelect;
        throw new Error(`document select not implemented`);
      case "pages":
        select = field as SectionSelect;
        const t = await datasource.getTemplateForDocument({ path: value });
        const d = await datasource.getData({ path: value });
        return {
          __typename: t.label,
          ...d,
        };
      case "simple":
        select = field as SimpleSelect;
        return value;
    }
  },
};

export const select = {
  getter,
  resolvers,
  builders,
};
