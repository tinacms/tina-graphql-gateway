import { schemaBuilder } from "./builder";
import { cacheInit } from "./cache";
import { graphqlInit } from "./resolver";
import { buildASTSchema } from "graphql";
import { FileSystemManager } from "./datasources/filesystem-manager";
import { GithubManager, clearCache } from "./datasources/github-manager";
import path from "path";
import cors from "cors";
import http from "http";
import WebSocket from "ws";
import express from "express";
// @ts-ignore
import bodyParser from "body-parser";
import fs from "fs";
import p from "path";

export const gql = async ({
  projectRoot,
  query,
  variables,
}: {
  projectRoot: string;
  query: string;
  variables: object;
}) => {
  console.log("using fs manager", projectRoot);
  console.log("root dir", await fs.readdirSync(p.join(projectRoot, "")));
  console.log("content", await fs.readdirSync(p.join(projectRoot, "content")));

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
}: {
  accessToken: string;
  owner: string;
  repo: string;
  query: string;
  variables: object;
}) => {
  const datasource = new GithubManager({
    rootPath: "apps/demo",
    accessToken,
    owner,
    repo,
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

export const startServer = async ({
  port,
  root,
}: {
  port: number;
  root?: string;
}) => {
  const app = express();
  const server = http.createServer(app);

  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (message: string) => {
      console.log("received: %s", message);
      ws.send(`Hello, you sent -> ${message}`);
    });

    ws.send("Hi there, I am a WebSocket server?");
  });

  app.use(cors());
  app.use(bodyParser.json());

  let projectRoot = root ? root : path.join(process.cwd());

  const datasource = new FileSystemManager(projectRoot);
  const cache = cacheInit(datasource);
  const { schema, sectionMap } = await schemaBuilder({ cache });

  app.post("/graphql", async (req, res) => {
    const { query, variables } = req.body;
    const result = await githubRoute({
      accessToken: "652a1dfef83723720aba1d836400a5782de2626c",
      owner: "forestryio",
      repo: "graphql-demo",
      query,
      variables,
    });
    return res.json(result);
  });

  app.post("/graphql2", async (req, res) => {
    const { query, variables } = req.body;

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
    return res.json(result);
  });

  server.listen(port, () => {
    console.info(`Listening on http://localhost:${port}`);
  });
};
