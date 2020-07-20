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
const auditMigrateOption = {
  name: "--migrate",
  description:
    "Move .forestry configuration to .tina folder. This will fix any errors",
};
const auditFixOption = {
  name: "--fix",
  description: "Fix errors in the .tina folder configuration",
};
const auditForestryOption = {
  name: "--forestry",
  description: "Audit the .forestry configuration without migration",
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
    options: [auditFixOption, auditMigrateOption, auditForestryOption],
    action: (options) => chain([audit], options),
  },
  {
    command: CMD_START_SERVER,
    description: "Start Filesystem Graphql Server",
    options: [startServerPortOption],
    action: (options) => chain([startServer], options),
  },
];
