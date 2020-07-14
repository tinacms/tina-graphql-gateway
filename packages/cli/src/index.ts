import * as path from "path";

require("dotenv").config({ path: path.resolve(__dirname, "../.env") }); // load process.env values

import * as commander from "commander";
//@ts-ignore
import { version } from "../package.json";
import { Command } from "./command";
export const CMD_ROOT = "forestry";
import { baseCmds as baseCommands } from "./cmds/baseCmds";
import { logText } from "./utils/theme";

const program = new commander.Command();
const registerCommands = (commands: Command[], noHelp: boolean = false) => {
  commands.forEach((command, i) => {
    let newCmd = program
      .command(command.command, { noHelp })
      .description(command.description)
      .action((...args) => {
        console.log("");
        command.action(...args);
      });

    if (command.alias) {
      newCmd = newCmd.alias(command.alias);
    }

    newCmd.on("--help", function () {
      if (command.examples) {
        console.log(`\nExamples:\n  ${command.examples}`);
      }
      if (command.subCommands) {
        console.log("\nCommands:");
        const optionTag = " [options]";
        command.subCommands.forEach((subcommand, i) => {
          const commandStr = `${subcommand.command}${
            (subcommand.options || []).length ? optionTag : ""
          }`;

          const padLength =
            Math.max(...command.subCommands.map((sub) => sub.command.length)) +
            optionTag.length;
          console.log(
            `${commandStr.padEnd(padLength)} ${subcommand.description}`
          );
        });
      }
      console.log("");
    });

    (command.options || []).forEach((option) => {
      newCmd.option(option.name, option.description);
    });

    if (command.subCommands) {
      registerCommands(command.subCommands, true);
    }
  });
};

export async function init(args: any) {
  program.version(version);

  const commands: Command[] = [...baseCommands];

  registerCommands(commands);

  program.usage("command [options]");
  // error on unknown commands
  program.on("command:*", function () {
    console.error(
      "Invalid command: %s\nSee --help for a list of available commands.",
      args.join(" ")
    );
    process.exit(1);
  });

  program.on("--help", function () {
    console.log(
      logText(`
You can get help on any command with "-h" or "--help".
e.g: "tina sites --help"
    `)
    );
  });

  if (!process.argv.slice(2).length) {
    // no subcommands
    program.help();
  }

  program.parse(args);
}
