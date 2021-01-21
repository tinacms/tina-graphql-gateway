/**
Copyright 2019 Forestry.io Inc
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

import * as commander from "commander";
//@ts-ignore
import { version } from "../package.json";
import { Command } from "./command";
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
e.g: "forestry types:gen --help"
    `)
    );
  });

  if (!process.argv.slice(2).length) {
    // no subcommands
    program.help();
  }

  program.parse(args);
}
