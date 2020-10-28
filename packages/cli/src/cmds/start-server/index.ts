// @ts-ignore
import { startServer as gqlStartServer } from "@forestryio/gql";
import childProcess from "child_process";

interface Options {
  port?: number;
  command?: string;
}

export async function startServer(
  _ctx,
  _next,
  { port = 4001, command }: Options
) {
  const commands = command.split(" ");
  await gqlStartServer({ port });
  const ps = childProcess.spawn(commands[0], [commands[1]], {
    stdio: "inherit",
  });
  ps.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
    process.exit(1);
  });
}
