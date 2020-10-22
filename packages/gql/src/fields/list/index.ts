import * as yup from "yup";
import { gql } from "../../gql";

import { select } from "../select";
import { text } from "../text";
import { builder } from "../../builder";

import type { BuildArgs, ResolveArgs } from "../";
import type { TinaField } from "../index";
import type { ImageGalleryField } from "../image-gallery";

export const list = {
  /**
   * Image Gallery uses list for now, Tina has plans to
   * implement a proper gallery field
   */
  imageGalleryField: (field: ImageGalleryField) => ({
    ...field,
    type: "list" as const,
    config: {
      use_select: false,
    },
  }),
  build: {
    /** Returns one of 3 possible types of select options */
    field: async ({ cache, field, accumulator }: BuildArgs<ListField>) => {
      // FIXME: shouldn't have to do this, but if a text or select field
      // is otherwise not present in the schema we need to ensure it's built
      text.build.field({
        cache,
        field: { name: "", label: "", type: "text", __namespace: "" },
        accumulator,
      });
      select.build.field({
        cache,
        field: {
          name: "",
          label: "",
          type: "select",
          config: {
            options: [""],
            source: {
              type: "simple",
            },
          },
        },
        accumulator,
      });

      const unionName = "List_FormFieldsUnion";
      accumulator.push(
        gql.union({ name: unionName, types: ["TextField", "SelectField"] })
      );

      const name = "ListField";
      accumulator.push(
        gql.object({
          name,
          fields: [
            gql.string("name"),
            gql.string("label"),
            gql.string("component"),
            gql.string("defaultItem"),
            gql.field({ name: "field", type: unionName }),
          ],
        })
      );

      return name;
    },
    initialValue: async ({ field }: BuildArgs<ListField>) => {
      return gql.stringList(field.name);
    },
    value: async ({ cache, field, accumulator }: BuildArgs<ListField>) => {
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

          const fieldUnionName = await builder.documentUnion({
            cache,
            section,
            accumulator,
            build: false,
          });

          // TODO: refactor this to use the select
          return gql.fieldList({ name: field.name, type: fieldUnionName });
        case "simple":
          list = field as SimpleList;
          return gql.stringList(field.name);
      }
    },
    input: async ({ field }: BuildArgs<ListField>) => {
      return gql.inputValueList(field.name, "String");
    },
  },
  resolve: {
    field: async ({
      datasource,
      field,
    }: Omit<ResolveArgs<ListField>, "value">): Promise<TinaListField> => {
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
      value,
    }: ResolveArgs<ListField>): Promise<
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
      field,
      value,
    }: ResolveArgs<ListField>): Promise<
      | {
          _resolver: "_resource";
          _resolver_kind: "_nested_sources";
          _args: { fullPaths: string[]; section: string };
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
          list = field as SectionList;
          return {
            _resolver: "_resource",
            _resolver_kind: "_nested_sources",
            _args: {
              fullPaths: value,
              section: list.config.source.section,
            },
          };
        case "simple":
          list = field as SimpleList;
          return value;
      }
    },
    input: async ({
      field,
      value,
    }: ResolveArgs<ListField>): Promise<
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
