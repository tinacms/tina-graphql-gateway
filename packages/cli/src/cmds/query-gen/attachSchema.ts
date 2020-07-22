import {
  buildSchema as buildForestrySchema,
  FileSystemManager,
} from "@forestryio/graphql";

export async function attachSchema(ctx: any, next: () => void, options) {
  const rootPath = process.cwd();
  const dataSource = new FileSystemManager(rootPath);

  const { schema } = await buildForestrySchema(
    { rootPath, siteLookup: "" },
    dataSource
  );

  ctx.schema = schema;
  next();
}
