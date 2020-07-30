import { Command } from "../command";
import { chain } from "../middleware";
import { genTypes, attachSchema, genQueries } from "./query-gen";
import { audit, migrate, dump } from "./audit";
import { startServer } from "./start-server";

export const CMD_GEN_QUERY = "schema:gen-query";
export const CMD_AUDIT = "schema:audit";
export const CMD_DUMP = "schema:dump";
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
const schemaDumpOption = {
  name: "--folder <folder>",
  description: "Dump the schema into the given path",
};
const migrateDryRunOption = {
  name: "--dry-run",
  description: "Audit the .forestry config without migrating",
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
    description: "Audit .tina schema",
    options: [auditFixOption],
    action: (options) => chain([audit], options),
  },
  {
    command: CMD_MIGRATE,
    description: "Migrate .forestry to .tina",
    options: [migrateDryRunOption],
    action: (options) => chain([migrate], options),
  },
  {
    command: CMD_DUMP,
    description: "Dump JSON schema into specified path",
    options: [schemaDumpOption],
    action: (options) => chain([dump], options),
  },
  {
    command: CMD_START_SERVER,
    description: "Start Filesystem Graphql Server",
    options: [startServerPortOption],
    action: (options) => chain([startServer], options),
  },
];
