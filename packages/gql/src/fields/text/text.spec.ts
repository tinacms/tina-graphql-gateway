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

import fs from "fs";
import path from "path";
import { cacheInit } from "../../cache";
import { text } from ".";
import { FileSystemManager } from "../../datasources/filesystem-manager";
import {
  parse,
  print,
  printType,
  buildSchema,
  typeFromAST,
  printSchema,
  GraphQLObjectType,
  buildASTSchema,
  buildClientSchema,
} from "graphql";
import { gql } from "@forestryio/graphql-helpers/dist/test-util";
import type { Definitions } from "../templates/build";
import { builder } from "../templates/build";

const PATH_TO_TEST_APP = path.join(
  path.resolve(__dirname, "../../../../../"),
  "apps/test"
);

const datasource = new FileSystemManager(PATH_TO_TEST_APP);
const cache = cacheInit(datasource);

const field = {
  label: "My Title",
  name: "title",
  type: "text" as const,
  __namespace: "",
};

const template = {
  __namespace: "",
  fields: [field],
  label: "Sample",
  name: "sample",
};

describe("Text builder", () => {
  test("sets the field type as part of the form field union", async () => {
    const accumulator: Definitions[] = [];
    await builder.form({
      cache,
      template,
      accumulator,
      includeBody: false,
    });

    expect(
      gql`
        ${accumulator.map((acc) => print(acc)).join("\n")}
      `
    ).toEqual(gql`
      type TextField implements FormField {
        name: String
        label: String
        component: String
      }
      union Sample_FormFieldsUnion = TextField
      type Sample_Form {
        label: String
        name: String
        fields: [Sample_FormFieldsUnion]
      }
    `);
  });
  test("sets the value type as part value object", async () => {
    const accumulator: Definitions[] = [];
    await builder.values({
      cache,
      template,
      accumulator,
      includeBody: false,
    });

    expect(
      gql`
        ${accumulator.map((acc) => print(acc)).join("\n")}
      `
    ).toEqual(gql`
      type Sample_Values {
        title: String
        _template: String
      }
    `);
  });
  test("sets the data type as part data object", async () => {
    const accumulator: Definitions[] = [];
    await builder.data({
      cache,
      template,
      accumulator,
      includeBody: false,
    });

    expect(
      gql`
        ${accumulator.map((acc) => print(acc)).join("\n")}
      `
    ).toEqual(gql`
      type Sample_Data {
        title: String
      }
    `);
  });
  test("sets the input type as part input object", async () => {
    const accumulator: Definitions[] = [];
    await builder.input({
      cache,
      template,
      accumulator,
      includeBody: false,
    });

    expect(
      gql`
        ${accumulator.map((acc) => print(acc)).join("\n")}
      `
    ).toEqual(gql`
      input Sample_Input {
        title: String
      }
    `);
  });
});
