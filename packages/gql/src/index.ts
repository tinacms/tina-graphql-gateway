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

export const startFixtureServer = async () => {
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

  console.log("drrr", __dirname);
  const fixturePath = path.join(process.cwd(), `src/fixtures`);
  app.get("/list-projects", async (req, res) => {
    return res.json(
      await fs.readdirSync(fixturePath).map((folderName) => {
        return { label: folderName, value: folderName };
      })
    );
  });

  app.get("/list-documents/:schema", async (req, res) => {
    return res.json(
      await Promise.all(
        await fs
          .readdirSync(
            path.join(fixturePath, req.path.replace("/list-documents", ""))
          )
          .filter((folderName) => folderName !== ".tina")
          .map(async (folderName) => {
            return {
              name: folderName,
              files: await fs.readdirSync(
                path.join(
                  fixturePath,
                  req.path.replace("/list-documents", ""),
                  folderName
                )
              ),
            };
          })
      )
    );
  });

  app.post("/:schema", async (req, res) => {
    const { query, variables } = req.body;

    const projectRoot = path.join(fixturePath, req.path);
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

  server.listen(4000, () => {
    console.info("Listening on http://localhost:4000");
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

  console.log("listen on", port);
  server.listen(port, () => {
    console.info(`Listening on http://localhost:${port}`);
  });
};
