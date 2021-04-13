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

import { schemaBuilder } from "./builder";
import { cacheInit } from "./cache";
import { graphqlInit } from "./resolver";
import { buildASTSchema } from "graphql";
import { FileSystemManager } from "./datasources/filesystem-manager";
import { GithubManager, clearCache } from "./datasources/github-manager";

export const gql = async ({
  projectRoot,
  query,
  variables,
}: {
  projectRoot: string;
  query: string;
  variables: object;
}) => {
  const accessToken = "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";
  const gh = new GithubManager({
    rootPath: "apps/demo",
    accessToken,
    owner: "tinacms",
    repo: "tina-graphql-gateway",
    ref: "main",
  });
  const datasource = new FileSystemManager("", {
    readFile: gh.readFile,
    readDir: gh.readDir,
    writeFile: gh.writeFile,
  });
  const cache = cacheInit(datasource);

  try {
    const { schema, sectionMap } = await schemaBuilder({ cache });

    const result = await graphqlInit({
      schema: buildASTSchema(schema),
      source: query,
      contextValue: { datasource },
      variableValues: variables,
      sectionMap,
    });
    return result;
  } catch (e) {
    console.log(e);
    return { error: e.message };
  }
};

export const buildSchema = async (projectRoot: string) => {
  const datasource = new FileSystemManager(projectRoot);
  const cache = cacheInit(datasource);

  const { schema } = await schemaBuilder({ cache });
  return buildASTSchema(schema);
};

export { clearCache };
export const githubRoute = async ({
  accessToken,
  owner,
  repo,
  query,
  variables,
  rootPath,
  branch,
}: {
  accessToken: string;
  owner: string;
  repo: string;
  query: string;
  variables: object;
  rootPath?: string;
  branch: string;
}) => {
  const datasource = new GithubManager({
    rootPath: rootPath || "",
    accessToken,
    owner,
    repo,
    branch,
  });
  const cache = cacheInit(datasource);
  const { schema, sectionMap } = await schemaBuilder({ cache });

  const result = await graphqlInit({
    schema: buildASTSchema(schema),
    source: query,
    contextValue: { datasource: datasource },
    variableValues: variables,
    sectionMap,
  });
  if (result.errors) {
    console.error(result.errors);
  }

  return result;
};
