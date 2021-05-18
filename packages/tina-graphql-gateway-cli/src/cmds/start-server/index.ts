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

import childProcess from "child_process";
import path from "path";
import { buildSchema } from "tina-graphql";
import { genTypes } from "../query-gen";
import { compile } from "../compile";
import chokidar from "chokidar";
import { successText, dangerText } from "../../utils/theme";

interface Options {
  port?: number;
  command?: string;
}

const gqlPackageFile = require.resolve("tina-graphql");

export async function startServer(
  _ctx,
  _next,
  { port = 4001, command }: Options
) {
  const startSubprocess = () => {
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
  };
  let projectRoot = path.join(process.cwd());
  let ready = false;
  if (!process.env.CI) {
    chokidar
      .watch(`${projectRoot}/**/*.ts`, {
        ignored: `${path.resolve(projectRoot)}/.tina/__generated__/**/*`,
      })
      .on("ready", async () => {
        try {
          console.log("Generating Tina config");
          await compile();
          const schema = await buildSchema(process.cwd());
          await genTypes({ schema }, () => {}, {});
          ready = true;
          startSubprocess();
        } catch (e) {
          console.log(dangerText(`${e.message}, exiting...`));
          console.log(e);
          process.exit(0);
        }
      })
      .on("all", async (event, path) => {
        if (ready) {
          console.log("Tina change detected, regenerating config");
          try {
            await compile();
            const schema = await buildSchema(process.cwd());
            await genTypes({ schema }, () => {}, {});
          } catch (e) {
            console.log(
              dangerText(
                "Compilation failed with errors, server has not been restarted"
              )
            );
            console.log(e.message);
          }
        }
      });
  }

  const state = {
    server: null,
    sockets: [],
  };

  let isReady = false;

  const start = async () => {
    const s = require("./server");
    state.server = await s.default();
    state.server.listen(port, () => {
      console.log(`Started Filesystem GraphQL server on port: ${port}`);
    });
    state.server.on("connection", (socket) => {
      state.sockets.push(socket);
    });
  };

  const restart = async () => {
    console.log("Detected change to gql package, restarting...");
    delete require.cache[gqlPackageFile];

    state.sockets.forEach((socket, index) => {
      if (socket.destroyed === false) {
        socket.destroy();
      }
    });
    state.sockets = [];
    state.server.close(() => {
      console.log("Server closed");
      start();
    });
  };

  if (!process.env.CI) {
    chokidar
      .watch(gqlPackageFile)
      .on("ready", async () => {
        isReady = true;
        start();
      })
      .on("all", async () => {
        if (isReady) {
          restart();
        }
      });
  } else {
    console.log("Detected CI environment, omitting watch commands...");
    start();
    startSubprocess();
  }
}
