// @ts-ignore
import { gql } from "@forestryio/gql";
import childProcess from "child_process";
import path from "path";
import cors from "cors";
import http from "http";
import express from "express";
// @ts-ignore
import bodyParser from "body-parser";

interface Options {
  port?: number;
  command?: string;
}

export async function startServer(
  _ctx,
  _next,
  { port = 4001, command }: Options
) {
  if (typeof command === "string") {
    const commands = command.split(" ");
    const ps = childProcess.spawn(commands[0], [commands[1]], {
      stdio: "inherit",
    });
    ps.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
      process.exit(code);
    });
  }
  await gqlServer({ port });
}

export const gqlServer = async ({ port }: { port: number }) => {
  const app = express();
  const server = http.createServer(app);
  app.use(cors());
  app.use(bodyParser.json());

  let projectRoot = path.join(process.cwd());

  app.post("/graphql", async (req, res) => {
    const { query, variables } = req.body;
    const result = await gql({ projectRoot, query, variables });
    return res.json(result);
  });

  server.listen(port, () => {
    console.info(`Listening on http://localhost:${port}`);
  });
  return server;
};
