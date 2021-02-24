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

import path from "path";
import {
  GraphQLSchema,
  printSchema,
  GraphQLObjectType,
  getNamedType,
  GraphQLUnionType,
  buildSchema,
  print,
} from "graphql";
import { FileSystemManager } from "../datasources/filesystem-manager";
import { gql } from "@forestryio/graphql-helpers/dist/test-util";
import { builder } from "../fields/templates/build";
import { cacheInit } from "../cache";

import type { Definitions } from "../fields/templates/build";
import type { Field } from ".";

export const testCache = ({ mockGetTemplate }: { mockGetTemplate?: any }) => {
  const projectRoot = path.join(process.cwd(), "src/fixtures/project1");
  const filesystemDataSource = new FileSystemManager(projectRoot);
  if (mockGetTemplate) {
    filesystemDataSource.getTemplate = mockGetTemplate;
  }
  return cacheInit(filesystemDataSource);
};

export const assertSchema = (schema: GraphQLSchema) => {
  // Useful to grab a snapshot
  // console.log(printSchema(schema));
  return {
    matches: (gqlString: string) => {
      expect(printSchema(schema)).toEqual(printSchema(buildSchema(gqlString)));
    },
  };
};
export const assertType = (type: GraphQLObjectType<any, any>) => {
  // Useful to grab a snapshot
  // console.log(printSchema(new GraphQLSchema({ query: type })));
  return {
    matches: (gqlString: string) => {
      expect(printSchema(new GraphQLSchema({ query: type }))).toEqual(`schema {
  query: ${getNamedType(type)}
}

${gqlString}`);
    },
  };
};
export const assertNoTypeCollisions = (
  types: GraphQLObjectType<any, any>[]
) => {
  const union = new GraphQLUnionType({
    name: "MultitypeUnion",
    types: types,
  });
  const t = new GraphQLObjectType({
    name: "MultitypeObject",
    fields: { f: { type: union } },
  });
  const names = types.map((t) => getNamedType(t).toString());
  const isArrayUnique = (arr: string[]) =>
    Array.isArray(arr) && new Set(arr).size === arr.length; // add function to check that array is unique.
  try {
    expect(isArrayUnique(names)).toBeTruthy();
  } catch (e) {
    // console.error("Types are equal");
    throw new Error(`Unable to create schema with multiple identical types`);
  }
  const schema = new GraphQLSchema({ query: t });
  // Useful to grab a snapshot
  // console.log(printSchema(schema));
};

const PATH_TO_TEST_APP = path.join(
  path.resolve(__dirname, "../../../../../"),
  "apps/test"
);

const datasource = new FileSystemManager(PATH_TO_TEST_APP);
const cache = cacheInit(datasource);

export const setupRunner = (field: Field) => {
  const template = {
    __namespace: "",
    fields: [field],
    label: "Sample",
    name: "sample",
  };

  const config = (accumulator: Definitions[]) => ({
    cache,
    template,
    accumulator,
    includeBody: false,
  });

  const prettify = (arr: Definitions[]) => {
    return gql`
      ${arr.map((acc) => print(acc)).join("\n")}
    `;
  };

  const run = async (command: keyof typeof builder) => {
    const accumulator: Definitions[] = [];
    await builder[command](config(accumulator));

    return prettify(accumulator);
  };

  return run;
};
