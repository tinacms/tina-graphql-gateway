/**
Copyright 2021 Forestry.io Inc
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { gql } from "../../gql";
import { friendlyName } from "@forestryio/graphql-helpers";

import { BuildArgs, ResolveArgs, assertIsString } from "../";

const typename = "SelectField";

export const select = {
  build: {
    /** Returns one of 3 possible types of select options */
    field: async ({ field, accumulator }: BuildArgs<SelectField>) => {
      accumulator.push(gql.formField(typename, [gql.stringList("options")]));
      return gql.field({
        name: field.name,
        type: typename,
      });
    },
    initialValue: async ({ field }: BuildArgs<SelectField>) => {
      return gql.reference(field.name);
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
            type: friendlyName(name, { suffix: "Document" }),
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
        __typename: typename,
      };
      switch (field.config.source.type) {
        case "documents":
          throw new Error(`document select not implemented`);
        case "pages":
          select = field as SectionSelect;
          return {
            ...f,
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
      try {
        assertIsString(value, { source: "select input" });
        switch (field.config.source.type) {
          case "documents":
            throw new Error(`document select not implemented`);
          case "pages":
          // TODO: check if reference exists
          case "simple":
            return { [field.name]: value };
        }
      } catch (e) {
        return false;
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
