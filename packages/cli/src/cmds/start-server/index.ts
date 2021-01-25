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
