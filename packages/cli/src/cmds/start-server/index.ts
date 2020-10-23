// @ts-ignore
import { startServer as gqlStartServer } from "@forestryio/gql";

interface Options {
  port?: number;
}

export async function startServer(_ctx, _next, { port = 4001 }: Options) {
  // @ts-ignore
  await gqlStartServer({ port });
}
