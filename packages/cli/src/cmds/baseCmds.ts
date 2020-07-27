import { Command } from "../command";
import { chain } from "../middleware";
import { genTypes, attachSchema, genQueries } from "./query-gen";
import { audit } from "./audit";
import { startServer } from "./start-server";

export const CMD_GEN_QUERY = "schema:gen-query";
export const CMD_AUDIT = "schema:audit";
export const CMD_START_SERVER = "server:start";

const startServerPortOption = {
  name: "--port <port>",
  description: "Specify a port to run the server on. (default 4001)",
};
const auditPathOption = {
  name: "--path <forestryPath>",
  description: "Specify a relative path to the .forestry folder (eg. my-site)",
};
const typescriptOption = {
  name: "--typescript",
  description: "Generate types for the schema",
};

export const baseCmds: Command[] = [
  {
    command: CMD_GEN_QUERY,
    description:
      "Generate a GraphQL query for your site's schema, (and optionally Typescript types)",
    options: [typescriptOption],
    action: (options) => chain([attachSchema, genQueries, genTypes], options),
  },
  {
    command: CMD_AUDIT,
    description: "Audit Forestry schema",
    options: [auditPathOption],
    action: (options) => chain([audit], options),
  },
  {
    command: CMD_START_SERVER,
    description: "Start Filesystem Graphql Server",
    options: [startServerPortOption],
    action: (options) => chain([startServer], options),
  },
];
