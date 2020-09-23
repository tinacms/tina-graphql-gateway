import path from "path";
import fs from "fs";
import { schemaBuilder } from "./schema-builder";
import { FileSystemManager } from "./datasources/filesystem-manager";
import { print, printSchema } from "graphql";
import { queryBuilder } from "@forestryio/graphql-helpers";

describe("Schema builder", () => {
  test("does it", async () => {
    const projectRoot = path.join(process.cwd(), "src/fixtures/project1");

    const datasource = new FileSystemManager(projectRoot);
    const schema = await schemaBuilder({ datasource });

    // Writing these for now, useful for debugging
    await fs.writeFileSync(
      path.join(projectRoot, "temp.gql"),
      printSchema(schema)
    );
    await fs.writeFileSync(
      path.join(projectRoot, "query.gql"),
      // @ts-ignore FIXME: for some reason this has a wierd type
      print(queryBuilder(schema))
    );
  });
});
