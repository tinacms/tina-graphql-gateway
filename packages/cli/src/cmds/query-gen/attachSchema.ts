import { buildSchema } from "@forestryio/gql";

export async function attachSchema(ctx: any, next: () => void, options) {
  const rootPath = process.cwd();
  const schema = await buildSchema(rootPath);

  ctx.schema = schema;
  next();
}
