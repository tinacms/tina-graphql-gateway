import { startFixtureServer } from "@forestryio/gql";
import childProcess from "child_process";

interface Options {
  port?: number;
  command?: string;
  root?: boolean;
}

export async function playgroundServer(
  _ctx,
  _next,
  { port = 4002, command, root }: Options
) {
  if (typeof command === "string") {
    const commands = command.split(" ");
    const ps = childProcess.spawn(commands[0], [commands[1]], {
      stdio: "inherit",
    });
    ps.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
      process.exit(1);
    });
  }
  await startFixtureServer({ port });
}
