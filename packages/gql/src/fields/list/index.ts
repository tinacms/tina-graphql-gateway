import * as yup from "yup";
import { friendlyName } from "@forestryio/graphql-helpers";
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLUnionType,
} from "graphql";
import { gql } from "../../gql";

import { select } from "../select";
import { builder } from "../../builder";

import type { Cache } from "../../cache";
import type { TinaField } from "../index";
import type { DataSource } from "../../datasources/datasource";
import type { Definitions } from "../../builder/ast-builder";

export const list = {
  build: {
    /** Returns one of 3 possible types of select options */
    field: async ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: ListField;
      accumulator: Definitions[];
    }) => {
      accumulator.push({
        kind: "ObjectTypeDefinition",
        name: {
          kind: "Name",
          value: "ListField",
        },
        interfaces: [],
        directives: [],
        fields: [],
      });

      return "ListField";

      // return await cache.build(
      //   "ListField",
      //   async () =>
      //     new GraphQLObjectType({
      //       name: "ListField",
      //       fields: {
      //         name: { type: GraphQLString },
      //         label: { type: GraphQLString },
      //         component: { type: GraphQLString },
      //         defaultItem: { type: GraphQLString },
      //         field: {
      //           type: new GraphQLUnionType({
      //             name: "ListFormFieldItemField",
      //             types: [
      //               // FIXME: this should pass the fields ('text' | 'textarea' | 'number' | 'select') through to buildTemplateFormFields
      //               await cache.build(
      //                 "SelectField",
      //                 async () =>
      //                   new GraphQLObjectType({
      //                     name: "SelectField",
      //                     fields: {
      //                       component: { type: GraphQLString },
      //                       options: { type: GraphQLList(GraphQLString) },
      //                     },
      //                   })
      //               ),
      //               await cache.build(
      //                 "TextField",
      //                 async () =>
      //                   new GraphQLObjectType({
      //                     name: "TextField",
      //                     fields: {
      //                       component: { type: GraphQLString },
      //                     },
      //                   })
      //               ),
      //             ],
      //           }),
      //         },
      //       },
      //     })
      // );
    },
    initialValue: async ({
      cache,
      field,
    }: {
      cache: Cache;
      field: ListField;
    }) => {
      return gql.string(field.name);
    },
    value: async ({ cache, field }: { cache: Cache; field: ListField }) => {
      return gql.string(field.name);

      // let listTypeIdentifier: "simple" | "pages" | "documents" = "simple";
      // const isSimple = field.config.use_select ? false : true;
      // if (!isSimple) {
      //   listTypeIdentifier =
      //     field.config?.source?.type === "documents"
      //       ? "documents"
      //       : field.config?.source?.type === "pages"
      //       ? "pages"
      //       : "simple";
      // }

      // let list;
      // switch (listTypeIdentifier) {
      //   case "documents":
      //     list = field as DocumentList;
      //     throw new Error(`document select not implemented`);
      //   case "pages":
      //     list = field as SectionList;
      //     const section = list.config.source.section;
      //     return {
      //       type: await cache.build(
      //         friendlyName(list, "Documents"),
      //         async () =>
      //           new GraphQLObjectType({
      //             name: friendlyName(list, "Documents"),
      //             fields: {
      //               documents: {
      //                 type: GraphQLList(
      //                   await builder.documentUnion({ cache, section })
      //                 ),
      //               },
      //             },
      //           })
      //       ),
      //     };
      //   case "simple":
      //     list = field as SimpleList;
      //     return { type: GraphQLList(GraphQLString) };
      // }
    },
    input: async ({ cache, field }: { cache: Cache; field: ListField }) => {
      return GraphQLList(GraphQLString);
    },
  },
  resolve: {
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
      let defaultItem = "";

      // FIXME this should be a subset type of TinaField,
      // this property doesn't need most of these fields
      let fieldComponent: TinaField = {
        default: "",
        name: "",
        label: "Text",
        component: "text",
        __typename: "TextField" as const,
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
            __typename: "SelectField",
          };
          fieldComponent = await select.resolve.field({
            datasource,
            field: selectField,
          });
          defaultItem = fieldComponent.options[0];
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
        defaultItem,
        __typename: "ListField",
      };
    },
    initialValue: async ({
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
      return value;
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
    input: async ({
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
          // TODO: validate the documents exists
          return value;
        case "simple":
          // TODO: validate the item is in the options list if it's a select
          list = field as SimpleList;
          return value;
      }
    },
  },
};

function assertIsStringArray(value: unknown): asserts value is string[] {
  const schema = yup.array().of(yup.string());
  schema.validateSync(value);
}

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
  defaultItem: string;
  __typename: "ListField";
};
