import { Command } from "../command";
import { chain } from "../middleware";
import { login } from "./login";

export const CMD_AUTH = "login";

export const baseCmds: Command[] = [
  {
    command: CMD_AUTH,
    description: "log in to Forestry account",
    action: (options) => chain([login], options),
  },
];
