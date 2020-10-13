import path from "path";
import fs from "fs";
import cors from "cors";
import http from "http";
import WebSocket from "ws";
import express from "express";
// @ts-ignore
import bodyParser from "body-parser";

import { builder } from "./builder/index2";
import { cacheInit } from "./cache";
import { graphqlInit } from "./resolver";
import { buildASTSchema, printSchema } from "graphql";
import { FileSystemManager } from "./datasources/filesystem-manager";

const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

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

app.get("/list-projects", async (req, res) => {
  return res.json([
    // TODO: look up fixtures and provide them here for testing
    { label: "Project 1", value: "project1" },
    { label: "Project 2", value: "project2" },
    { label: "Project 3", value: "project3" },
    { label: "Project 4", value: "project4" },
  ]);
});

app.post("/:schema", async (req, res) => {
  const { query, variables } = req.body;

  const projectRoot = path.join(process.cwd(), `src/fixtures${req.path}`);
  const datasource = new FileSystemManager(projectRoot);
  const cache = cacheInit(datasource);
  const schema = await builder.schema({ cache });
  await fs.writeFileSync(
    path.join(projectRoot, "ast-schema.graphql"),
    printSchema(buildASTSchema(schema))
  );
  // const result = await graphqlInit({
  //   schema,
  //   source: query,
  //   contextValue: { datasource },
  //   variableValues: variables,
  // });
  // if (result.errors) {
  //   console.error(result.errors);
  // }
  // return res.json(result);
});

server.listen(4000, () => {
  console.info("Listening on http://localhost:4000");
});
