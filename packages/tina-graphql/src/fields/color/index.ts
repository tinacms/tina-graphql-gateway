/**
Copyright 2021 Forestry.io Holdings, Inc.
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

import { assertIsString, BuildArgs, ResolveArgs } from "../";

const typename = "ColorField";

export const color = {
  build: {
    field: async ({ field, accumulator }: BuildArgs<ColorField>) => {
      accumulator.push(gql.FormFieldBuilder({ name: typename, additionalFields: [
        gql.FieldDefinition({
        name: "colorFormat",
        type: gql.TYPES.String,
      }),
      gql.FieldDefinition({
        name: "widget",
        type: gql.TYPES.String,
      }),
      gql.FieldDefinition({
        name: "colors",
        type: gql.TYPES.JSONObject,
      }),
    ]}));
      return gql.FieldDefinition({
        name: field.name,
        type: typename,
      });
    },
    initialValue: ({ field }: BuildArgs<ColorField>) => {
      return gql.FieldDefinition({ name: field.name, type: gql.TYPES.String });
    },
    value: ({ field }: BuildArgs<ColorField>) => {
      return gql.FieldDefinition({ name: field.name, type: gql.TYPES.String });
    },
    input: ({ field }: BuildArgs<ColorField>) => {
      return gql.InputValueDefinition({
        name: field.name,
        type: gql.TYPES.String,
      });
    },
  },
  resolve: {
    field: ({
      field,
    }: Omit<ResolveArgs<ColorField>, "value">): TinaColorField => {
      const { type, ...rest } = field;
      return {
        // default values from Tinacms where not working so added them here
        widget: "sketch",
        colorFormat: "hex",
        colors:  [
          '#D0021B',
          '#F5A623',
          '#F8E71C',
          '#8B572A',
          '#7ED321',
          '#417505',
          '#BD10E0',
          '#9013FE',
          '#4A90E2',
          '#50E3C2',
          '#B8E986',
          '#000000',
          '#4A4A4A',
          '#9B9B9B',
          '#FFFFFF',
        ],
        ...rest,
        component: "color",
        config: rest.config || {
          required: false,
        },
        __typename: "ColorField",
      };
    },
    initialValue: async ({
      value,
    }: ResolveArgs<ColorField>): Promise<string> => {
      assertIsString(value, { source: "color initial value" });
      return value;
    },
    value: async ({ value }: ResolveArgs<ColorField>): Promise<string> => {
      assertIsString(value, { source: "color value" });
      return value;
    },
    input: async ({
      field,
      value,
    }: ResolveArgs<ColorField>): Promise<{ [key: string]: string } | false> => {
      try {
        console.log('------Input')
        assertIsString(value, { source: "color input" });
        return { [field.name]: value };
      } catch (e) {
        return false;
      }
    },
  },
};

export type ColorField = {
  label: string;
  name: string;
  type: "color";
  default?: string;
  config?: {
    required?: boolean;
  };
  __namespace: string;
};

export type TinaColorField = {
  label: string;
  name: string;
  colorFormat?: 'hex' | 'rgb' // Defaults to "hex"
  colors?: string[]
  widget?: 'sketch' | 'block' // Defaults to "sketch"
  component: "color";
  default?: string;
  config?: {
    required?: boolean;
  };
  __typename: typeof typename;
};
