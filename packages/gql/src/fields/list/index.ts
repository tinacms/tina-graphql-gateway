import type { TinaField } from "../index";
import type { DataSource } from "../../datasources/datasource";
import * as yup from "yup";
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLUnionType,
} from "graphql";
import type { Cache } from "../../schema-builder";
import { select } from "../select";

export type BaseListField = {
  label: string;
  name: string;
  type: "list";
};

type BaseConfig = {
  use_select: boolean;
  required?: boolean;
  min?: number;
  max?: number;
};
export type SimpleList = BaseListField & {
  // FIXME: this isn't required at all for simple lists
  config: BaseConfig & {
    source?: undefined;
  };
};
export type DocumentList = BaseListField & {
  config: BaseConfig & {
    source: {
      type: "documents";
      section: string;
      file: string;
      path: string;
    };
  };
};
export type SectionList = BaseListField & {
  config: BaseConfig & {
    source: {
      type: "pages";
      section: string;
    };
  };
};

export type ListField = SectionList | SimpleList | DocumentList;
export type TinaListField = {
  label: string;
  name: string;
  component: "list";
  field: TinaField;
  __typename: "ListFormField";
};

const build = {
  /** Returns one of 3 possible types of select options */
  field: ({ cache, field }: { cache: Cache; field: ListField }) => {
    return cache.build(
      new GraphQLObjectType({
        name: "ListFormField",
        fields: {
          name: { type: GraphQLString },
          label: { type: GraphQLString },
          component: { type: GraphQLString },
          field: {
            type: new GraphQLUnionType({
              name: "ListFormFieldItemField",
              types: [
                // FIXME: this should pass the fields ('text' | 'textarea' | 'number' | 'select') through to buildTemplateFormFields
                cache.build(
                  new GraphQLObjectType({
                    name: "SelectFormField",
                    fields: {
                      component: { type: GraphQLString },
                      options: { type: GraphQLList(GraphQLString) },
                    },
                  })
                ),
                cache.build(
                  new GraphQLObjectType({
                    name: "TextareaFormField",
                    fields: {
                      component: { type: GraphQLString },
                    },
                  })
                ),
              ],
            }),
          },
        },
      })
    );
  },
  value: async ({ cache, field }: { cache: Cache; field: ListField }) => {
    let listTypeIdentifier: "simple" | "pages" | "documents" = "simple";
    const isSimple = field.config.use_select ? false : true;
    if (!isSimple) {
      listTypeIdentifier =
        field.config?.source?.type === "documents"
          ? "documents"
          : field.config?.source?.type === "pages"
          ? "pages"
          : "simple";
    }

    let list;
    switch (listTypeIdentifier) {
      case "documents":
        list = field as DocumentList;
        throw new Error(`document select not implemented`);
      case "pages":
        list = field as SectionList;
        const section = list.config.source.section;
        return {
          type: await cache.build(
            new GraphQLObjectType({
              name: `${list.label}Documents`,
              fields: {
                documents: {
                  type: GraphQLList(
                    await cache.builder.buildDocumentUnion({ cache, section })
                  ),
                },
              },
            })
          ),
        };
      case "simple":
        list = field as SimpleList;
        return { type: GraphQLList(GraphQLString) };
    }
  },
};
const resolve = {
  field: async ({
    datasource,
    field,
  }: {
    datasource: DataSource;
    field: ListField;
  }): Promise<TinaListField> => {
    const { ...rest } = field;

    let listTypeIdentifier: "simple" | "pages" | "documents" = "simple";
    const isSimple = field.config.use_select ? false : true;
    if (!isSimple) {
      listTypeIdentifier =
        field.config?.source?.type === "documents"
          ? "documents"
          : field.config?.source?.type === "pages"
          ? "pages"
          : "simple";
    }

    // FIXME this should be a subset type of TinaField,
    // this property doesn't need most of these fields
    let fieldComponent: TinaField = {
      default: "",
      name: "",
      label: "Text",
      component: "text",
      __typename: "TextFormField" as const,
    };
    let list;
    switch (listTypeIdentifier) {
      case "documents":
        list = field as DocumentList;
        throw new Error(`document list not implemented`);
      case "pages":
        list = field as SectionList;

        const selectField = {
          ...list,
          component: "select" as const,
          type: "select" as const,
          __typename: "SelectFormField",
        };
        fieldComponent = await select.resolve.field({
          datasource,
          field: selectField,
        });
        break;
      case "simple":
        list = field as SimpleList;
        break;
      // Do nothing, this is the default
    }

    return {
      ...rest,
      component: "list",
      field: fieldComponent,
      __typename: "ListFormField",
    };
  },
  value: async ({
    datasource,
    field,
    value,
  }: {
    datasource: DataSource;
    field: ListField;
    value: unknown;
  }): Promise<
    | {
        _resolver: "_resource";
        _resolver_kind: "_nested_sources";
        _args: { paths: string[] };
      }
    | string[]
  > => {
    assertIsStringArray(value);
    let listTypeIdentifier: "simple" | "pages" | "documents" = "simple";
    const isSimple = field.config.use_select ? false : true;
    if (!isSimple) {
      listTypeIdentifier =
        field.config?.source?.type === "documents"
          ? "documents"
          : field.config?.source?.type === "pages"
          ? "pages"
          : "simple";
    }
    let list;
    switch (listTypeIdentifier) {
      case "documents":
        list = field as DocumentList;
        throw new Error(`document list not implemented`);
      case "pages":
        return {
          _resolver: "_resource",
          _resolver_kind: "_nested_sources",
          _args: { paths: value },
        };
      case "simple":
        list = field as SimpleList;
        return value;
    }
  },
};

function assertIsStringArray(value: unknown): asserts value is string[] {
  const schema = yup.array().of(yup.string());
  schema.validateSync(value);
}

export const list = {
  resolve,
  build,
};
