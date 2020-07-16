import { Command } from "../command";
import { chain } from "../middleware";
import { genTypes } from "./type-gen";

export const CMD_GEN_TYPES = "types:gen";

export const baseCmds: Command[] = [
  {
    command: CMD_GEN_TYPES,
    description: "Generate Typescript types",
    action: (options) => chain([genTypes], options),
  },
];
