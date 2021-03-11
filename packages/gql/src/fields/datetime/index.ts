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

import { BuildArgs, ResolveArgs, assertIsString } from "../";

const typename = "DatetimeField";

export const datetime = {
  build: {
    field: async ({ field, accumulator }: BuildArgs<DatetimeField>) => {
      accumulator.push(gql.formField(typename));

      return gql.FieldDefinition({
        name: field.name,
        type: typename,
      });
    },
    initialValue: ({ field }: BuildArgs<DatetimeField>) => {
      return gql.FieldDefinition({ name: field.name, type: gql.TYPES.String });
    },
    value: ({ field }: BuildArgs<DatetimeField>) => {
      return gql.FieldDefinition({ name: field.name, type: gql.TYPES.String });
    },
    input: ({ field }: BuildArgs<DatetimeField>) => {
      return gql.InputValueDefinition({
        name: field.name,
        type: gql.TYPES.String,
      });
    },
  },
  resolve: {
    field: ({
      field,
    }: Omit<ResolveArgs<DatetimeField>, "value">): TinaDatetimeField => {
      const { type, ...rest } = field;

      return {
        ...rest,
        component: "date",
        __typename: typename,
        config: rest.config || {
          required: false,
        },
      };
    },
    initialValue: async ({
      value,
    }: ResolveArgs<DatetimeField>): Promise<string> => {
      assertIsString(value, { source: "datetime" });
      return value;
    },
    value: async ({ value }: ResolveArgs<DatetimeField>): Promise<string> => {
      assertIsString(value, { source: "datetime" });
      return value;
    },
    input: async ({
      field,
      value,
    }: ResolveArgs<DatetimeField>): Promise<
      { [key: string]: string } | false
    > => {
      try {
        assertIsString(value, { source: "datetime" });
        return { [field.name]: value };
      } catch (e) {
        return false;
      }
    },
  },
};

export type DatetimeField = {
  label: string;
  name: string;
  type: "datetime";
  default?: string;
  config?: {
    required?: boolean;
  };
  __namespace: string;
};

export type TinaDatetimeField = {
  label: string;
  name: string;
  component: "date";
  default?: string;
  config?: {
    required?: boolean;
  };
  __typename: typeof typename;
};
