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

import { splitDataNode } from "./queryBuilder";
import { buildSchema } from "graphql";
import fs from "fs";
import path from "path";

const PATH_TO_TEST_APP = path.join(
  path.resolve(__dirname, "../../.."),
  "apps/test"
);
const PATH_TO_TEST_SCHEMA = path.join(
  PATH_TO_TEST_APP,
  ".tina/__generated__/schema.gql"
);

describe("splitDataNode", () => {
  test("it should include fragments and nested fragments", async () => {
    const query = gql`
      fragment PostDetailsFragment on Post_Details_Data {
        reading_time
      }

      fragment PostFragment on Post_Doc_Data {
        title
        details {
          ...PostDetailsFragment
        }
      }

      query PostQuery {
        getPostsDocument(relativePath: "welcome.md") {
          data {
            __typename
            ...PostFragment
          }
        }
      }
    `;
    const schema = await fs.readFileSync(PATH_TO_TEST_SCHEMA).toString();
    const splitNodes = splitDataNode({
      queryString: query,
      schema: buildSchema(schema),
    });

    const getPostDocumentQuery = splitNodes.queries["getPostsDocument"];
    console.log(getPostDocumentQuery);

    expect(getPostDocumentQuery.fragments).toEqual(
      expect.arrayContaining(["PostFragment", "PostDetailsFragment"])
    );
    expect(getPostDocumentQuery.mutation).toEqual(gql`
      mutation updatePostsDocument(
        $relativePath: String!
        $params: Posts_Input!
      ) {
        data {
          __typename
          ...PostFragment
        }
      }
    `);
  });
});

/**
 *
 * This just "dedents" the template literal, calling it "gql" has the nice
 * side-effect that IDEs often provide graphql syntax highlighting for it
 */
export function gql(
  strings: TemplateStringsArray,
  ...values: string[]
): string {
  let str = "";

  for (let i = 0; i < strings.length; ++i) {
    str += strings[i];
    if (i < values.length) {
      // istanbul ignore next (Ignore else inside Babel generated code)
      const value = values[i];

      str += value; // interpolation
    }
  }
  const trimmedStr = str
    .replace(/^\n*/m, "") //  remove leading newline
    .replace(/[ \t]*$/, ""); // remove trailing spaces and tabs

  // fixes indentation by removing leading spaces and tabs from each line
  let indent = "";
  for (const char of trimmedStr) {
    if (char !== " " && char !== "\t") {
      break;
    }
    indent += char;
  }
  return trimmedStr.replace(RegExp("^" + indent, "mg"), ""); // remove indent
}
