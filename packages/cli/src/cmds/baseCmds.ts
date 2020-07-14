import { Command } from "../command";
import { chain } from "../middleware";
import { genTypes } from "./type-gen";
import { audit } from "./audit";

export const CMD_GEN_TYPES = "types:gen";
export const CMD_AUDIT = "schema:audit";

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
];
