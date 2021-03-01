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

import { gql } from "@forestryio/graphql-helpers/dist/test-util";
import { setupRunner } from "../test-util";
import { TextField } from ".";

const field: TextField = {
  label: "My Title",
  name: "title",
  type: "text" as const,
  __namespace: "",
};

const run = setupRunner(field);

describe(`Field of type ${field.type} builds`, () => {
  test("a union type of type TextField", async () => {
    expect(await run("form")).toEqual(gql`
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
  test("a value of type String", async () => {
    expect(await run("values")).toEqual(gql`
      type Sample_Values {
        title: String
        _template: String
      }
    `);
  });
  test("a field of type String", async () => {
    expect(await run("data")).toEqual(gql`
      type Sample_Data {
        title: String
      }
    `);
  });
  test("an input of type String", async () => {
    expect(await run("input")).toEqual(gql`
      input Sample_Input {
        title: String
      }
    `);
  });
});
