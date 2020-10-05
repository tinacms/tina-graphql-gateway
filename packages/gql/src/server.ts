import express from "express";
import path from "path";
import { FileSystemManager } from "./datasources/filesystem-manager";
import { schemaBuilder } from "./builder";
import { graphqlInit } from "./resolver";
// @ts-ignore
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import WebSocket from "ws";

const app = express();
//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws: WebSocket) => {
  //connection is up, let's add a simple simple event
  ws.on("message", (message: string) => {
    //log the received message and send it back to the client
    console.log("received: %s", message);
    ws.send(`Hello, you sent -> ${message}`);
  });

  //send immediatly a feedback to the incoming connection
  ws.send("Hi there, I am a WebSocket server?");
});

app.use(cors());
app.use(bodyParser.json());

app.get("/list-projects", async (req, res) => {
  return res.json([
    // TODO: look up fixtures and provide them here for testing
    { label: "Project 1", value: "project1" },
    { label: "Project 2", value: "project2" },
  ]);
});

app.post("/:schema", async (req, res) => {
  const { query, variables } = req.body;

  const projectRoot = path.join(process.cwd(), `src/fixtures${req.path}`);
  const datasource = new FileSystemManager(projectRoot);
  const schema = await schemaBuilder({ datasource });
  const result = await graphqlInit({
    schema,
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
