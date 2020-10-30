import path from "path";
import fs from "fs";
import cors from "cors";
import http from "http";
import WebSocket from "ws";
import express from "express";
// @ts-ignore
import bodyParser from "body-parser";

import { builder } from "./builder";
import { cacheInit } from "./cache";
import { graphqlInit } from "./resolver";
import { buildASTSchema } from "graphql";
import { FileSystemManager } from "./datasources/filesystem-manager";
import { GithubManager } from "./datasources/github-manager";

export const githubRoute = async ({
  owner,
  repo,
  query,
  variables,
}: {
  owner: string;
  repo: string;
  query: string;
  variables: object;
}) => {
  const datasource = new GithubManager({
    rootPath: "",
    accessToken: "a2f579a8792838e87d225136f90668feef8b44a6",
    owner,
    repo,
  });
  const cache = cacheInit(datasource);
  const schema = await builder.schema({ cache });

  console.log("done...");

  const result = await graphqlInit({
    schema: buildASTSchema(schema),
    source: query,
    contextValue: { datasource: datasource },
    variableValues: variables,
  });
  if (result.errors) {
    console.error(result.errors);
  }

  return result;
};

export const buildSchema = async (projectRoot: string) => {
  const datasource = new FileSystemManager(projectRoot);
  const cache = cacheInit(datasource);
  const schema = await builder.schema({ cache });

  return buildASTSchema(schema);
};

export const demo = async ({
  fixtureFolder,
  query,
  variables,
}: {
  fixtureFolder: string;
  query: string;
  variables: object;
}) => {
  const fixturePath = path.join(__dirname, "..", "src", "fixtures");
  const projectRoot = path.join(fixturePath, fixtureFolder);
  const datasource = new FileSystemManager(projectRoot);
  const cache = cacheInit(datasource);
  try {
    const schema = await builder.schema({ cache });

    const result = await graphqlInit({
      schema: buildASTSchema(schema),
      source: query,
      contextValue: { datasource },
      variableValues: variables,
    });
    return result;
  } catch (e) {
    console.error(e);
    return { message: "nothing" };
  }
};

export const startFixtureServer = async ({ port }: { port: number }) => {
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

  const fixturePath = path.join(__dirname, "..", "src", "fixtures");
  app.get("/list-projects", async (req, res) => {
    return res.json(
      await fs.readdirSync(fixturePath).map((folderName) => {
        return { label: folderName, value: folderName };
      })
    );
  });

  app.post("/:schema", async (req, res) => {
    const { query, variables } = req.body;

    const fixturePath = path.join(__dirname, "..", "src", "fixtures");
    const projectRoot = path.join(fixturePath, req.path);
    const datasource = new GithubManager({
      rootPath: "",
      accessToken: "a2f579a8792838e87d225136f90668feef8b44a6",
      owner: "jeffsee55",
      repo: "basic-schema",
    });
    const cache = cacheInit(datasource);
    const schema = await builder.schema({ cache });

    // const datasource2 = new FileSystemManager(projectRoot);
    // const cache2 = cacheInit(datasource2);
    // const schema2 = await builder.schema({ cache: cache2 });
    // await fs.writeFileSync("./fs.graphql", print(schema2));

    console.log("done...");

    const result = await graphqlInit({
      schema: buildASTSchema(schema),
      source: query,
      contextValue: { datasource: datasource },
      variableValues: variables,
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

export const startServer = async ({ port }: { port: number }) => {
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

  app.post("/graphql", async (req, res) => {
    const { query, variables } = req.body;

    const projectRoot = process.cwd();
    // const projectRoot = "/Users/jeffsee/code/graphql-demo/apps/demo";
    const datasource = new FileSystemManager(projectRoot);
    const cache = cacheInit(datasource);
    const schema = await builder.schema({ cache });

    const result = await graphqlInit({
      schema: buildASTSchema(schema),
      source: query,
      contextValue: { datasource },
      variableValues: variables,
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

// startServer({ port: 4001 });

startFixtureServer({ port: 4002 });
