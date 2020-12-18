import path from "path";
import fs from "fs";
import cors from "cors";
import http from "http";
import WebSocket from "ws";
import express from "express";
// @ts-ignore
import bodyParser from "body-parser";

import { schemaBuilder } from "./builder";
import { cacheInit } from "./cache";
import { graphqlInit } from "./resolver";
import { print, buildASTSchema } from "graphql";
import { FileSystemManager } from "./datasources/filesystem-manager";

export const startFixtureServer = async ({
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

  const fixturePath = path.join(__dirname, "..", "src", "fixtures");

  app.get("/list-projects", async (req, res) => {
    return res.json(
      await fs
        .readdirSync(fixturePath)
        .filter((item) => item !== ".DS_Store")
        .map((folderName) => {
          return { label: folderName, value: folderName };
        })
    );
  });

  app.post("/:schema", async (req, res) => {
    const { query, variables } = req.body;

    const fixturePath = path.join(__dirname, "..", "src", "fixtures");
    const projectRoot = root ? root : path.join(fixturePath, req.path);
    const datasource = new FileSystemManager(projectRoot);
    const cache = cacheInit(datasource);
    const { schema, sectionMap } = await schemaBuilder({ cache });
    await fs.writeFileSync(
      path.join(projectRoot, "ast-schema.graphql"),
      print(schema)
    );

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

startFixtureServer({ port: 4002 });
