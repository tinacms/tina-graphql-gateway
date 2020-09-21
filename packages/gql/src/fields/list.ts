import type { TinaField } from "./index";
import type { DataSource } from "../datasources/datasource";
import Joi from "joi";
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLUnionType,
} from "graphql";
import type { Cache } from "../schema-builder";
import { select } from "./select";

export type BaseListField = {
  label: string;
  name: string;
  type: "list";
};
export type TinaBaseListField = {
  label: string;
  name: string;
  type: "list";
  component: "list";
  field: TinaField;
  __typename: "ListFormField";
};
export type SimpleList = BaseListField & {
  config: {
    required?: boolean;
    use_select: boolean;
    min: undefined | number;
    max: undefined | number;
    source: undefined;
  };
};
export type TinaSimpleList = TinaBaseListField & {
  config: {
    required?: boolean;
    use_select: boolean;
    min: undefined | number;
    max: undefined | number;
    source: undefined;
  };
};
export type DocumentList = BaseListField & {
  config: {
    required?: boolean;
    use_select: boolean;
    min: undefined | number;
    max: undefined | number;
    source: {
      type: "documents";
      section: string;
      file: string;
      path: string;
    };
  };
};
export type TinaDocumentList = TinaBaseListField & {
  config: {
    required?: boolean;
    use_select: boolean;
    min: undefined | number;
    max: undefined | number;
    source: {
      type: "documents";
      section: string;
      file: string;
      path: string;
    };
  };
};
export type SectionList = BaseListField & {
  config: {
    required?: boolean;
    use_select: boolean;
    min: undefined | number;
    max: undefined | number;
    source: {
      type: "pages";
      section: string;
    };
  };
};

export type TinaSectionList = TinaBaseListField & {
  config: {
    required?: boolean;
    use_select: boolean;
    min: undefined | number;
    max: undefined | number;
    source: {
      type: "pages";
      section: string;
    };
  };
};
export type ListField = SectionList | SimpleList | DocumentList;
export type TinaListField = TinaSectionList | TinaSimpleList | TinaDocumentList;

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
      type: "text",
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
          config: {
            ...list.config,
            required: true,
          },
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
    field: TinaListField;
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
  const schema = Joi.array().items(Joi.string());
  const { error } = schema.validate(value);
  if (error) {
    throw new Error(error.message);
  }
}

export const list = {
  resolve,
  build,
};
