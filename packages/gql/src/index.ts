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
  const datasource = new FileSystemManager(projectRoot);
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
