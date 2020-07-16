import { Command } from "../command";
import { chain } from "../middleware";
import { genTypes } from "./type-gen";
import { audit } from "./audit";
import { startServer } from "./start-server";

export const CMD_GEN_TYPES = "types:gen";
export const CMD_AUDIT = "schema:audit";
export const CMD_START_SERVER = "server:start";

const startServerPortOption = {
  name: "--port <port>",
  description: "Specify a port to run the server on. (default 4001)",
};

export const baseCmds: Command[] = [
  {
    command: CMD_GEN_TYPES,
    description: "Generate Typescript types",
    action: (options) => chain([genTypes], options),
  },
  {
    command: CMD_AUDIT,
    description: "Audit Forestry schema",
    action: (options) => chain([audit], options),
  },
  {
    command: CMD_START_SERVER,
    description: "Start Filesystem Graphql Server",
    options: [startServerPortOption],
    action: (options) => chain([startServer], options),
  },
];
