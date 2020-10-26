import { startFixtureServer } from "@forestryio/gql";
import childProcess from "child_process";

interface Options {
  port?: number;
  command?: string;
}

export async function playgroundServer(
  _ctx,
  _next,
  { port = 4002, command }: Options
) {
  let commands = null;
  if (command) {
    commands = command.split(" ");
  }
  await startFixtureServer({ port });
  if (commands) {
    const ps = childProcess.spawn(commands[0], [commands[1]], {
      stdio: "inherit",
    });
    ps.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
      process.exit(1);
    });
  }
}
