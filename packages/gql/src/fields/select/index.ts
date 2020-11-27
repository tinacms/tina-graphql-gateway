import { gql } from "../../gql";
import { friendlyName } from "@forestryio/graphql-helpers";

import { BuildArgs, ResolveArgs } from "../";

export const select = {
  build: {
    /** Returns one of 3 possible types of select options */
    field: async ({ accumulator }: BuildArgs<SelectField>) => {
      const name = "SelectField";
      accumulator.push(
        gql.object({
          name,
          fields: [
            gql.string("name"),
            gql.string("label"),
            gql.string("component"),
            gql.stringList("options"),
            gql.string("refetchPolicy"),
          ],
        })
      );

      return name;
    },
    initialValue: async ({ field }: BuildArgs<SelectField>) => {
      return gql.string(field.name);
    },
    value: async ({ cache, field, accumulator }: BuildArgs<SelectField>) => {
      let select;
      switch (field.config.source.type) {
        case "documents":
          throw new Error(`document select not implemented`);
        case "pages":
          select = field as SectionSelect;

          const section = await cache.datasource.getSettingsForSection(
            select.config.source.section
          );
          const name = friendlyName(section.slug);

          return gql.field({
            name: field.name,
            type: friendlyName(name, "Document"),
          });
        case "simple":
          return gql.string(field.name);
      }
    },
    input: async ({ field }: BuildArgs<SelectField>) => {
      return gql.inputValue(field.name, "String");
    },
  },
  resolve: {
    field: async ({
      datasource,
      field,
    }: Omit<ResolveArgs<SelectField>, "value">): Promise<TinaSelectField> => {
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
            refetchPolicy: "onChange",
            options: [
              "",
              ...(await datasource.getDocumentsForSection(
                select.config.source.section
              )),
            ],
          };
        case "simple":
          select = field as SimpleSelect;
          return {
            ...f,
            options: ["", ...select.config.options],
          };
      }
    },
    initialValue: async ({ value }: ResolveArgs<SelectField>) => {
      return value;
    },
    value: async ({ field, value }: ResolveArgs<SelectField>) => {
      switch (field.config.source.type) {
        case "documents":
          throw new Error(`document select not implemented`);
        case "pages":
          return {
            _resolver: "_resource",
            _resolver_kind: "_nested_source",
            _args: { fullPath: value, section: field.config.source.section },
          };
        case "simple":
          return value;
      }
    },
    input: async ({ field, value }: ResolveArgs<SelectField>) => {
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
  /** When the value changes, should we hit the server? */
  refetchPolicy?: "none" | "onChange";
};
