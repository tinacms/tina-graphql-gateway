import { Command } from "../command";
import { chain } from "../middleware";
import { genTypes, attachSchema, genQueries } from "./query-gen";
import { audit, migrate } from "./audit";
import { startServer } from "./start-server";

export const CMD_GEN_QUERY = "schema:gen-query";
export const CMD_AUDIT = "schema:audit";
export const CMD_MIGRATE = "schema:migrate";
export const CMD_START_SERVER = "server:start";

const startServerPortOption = {
  name: "--port <port>",
  description: "Specify a port to run the server on. (default 4001)",
};
const auditFixOption = {
  name: "--fix",
  description: "Fix errors in the .tina folder configuration",
};
const auditForestryOption = {
  name: "--forestry",
  description: "Audit the .forestry folder without migration",
};
const auditDumpOption = {
  name: "--dump <path>",
  description: "Dump the schema into the given path",
};
const typescriptOption = {
  name: "--typescript",
  description: "Generate types for the schema",
};

export const baseCmds: Command[] = [
  {
    command: CMD_GEN_QUERY,
    description: "Generate Typescript types",
    options: [typescriptOption],
    action: (options) => chain([attachSchema, genQueries, genTypes], options),
  },
  {
    command: CMD_AUDIT,
    description: "Audit .tina schema",
    options: [auditFixOption, auditForestryOption, auditDumpOption],
    action: (options) => chain([audit], options),
  },
  {
    command: CMD_MIGRATE,
    description: "Migrate .forestry to .tina",
    action: (options) => chain([migrate], options),
  },
  {
    command: CMD_START_SERVER,
    description: "Start Filesystem Graphql Server",
    options: [startServerPortOption],
    action: (options) => chain([startServer], options),
  },
];
