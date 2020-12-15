import fs from "fs";
import path from "path";
import { cacheInit } from "../cache";
import { builder } from ".";
import { FileSystemManager } from "../datasources/filesystem-manager";
import { gql, assertSchema } from "../fields/test-util";
import { printSchema, buildASTSchema } from "graphql";

const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

describe("Schema builder", () => {
  test("does it", async () => {
    const projectRoot = path.join(process.cwd(), "src/fixtures/demo");
    const fixtures: string[] = await fs.readdirSync(
      path.join(process.cwd(), "src/fixtures")
    );

    await Promise.all(
      fixtures
        .filter((f) => f !== ".DS_Store")
        .map(async (f) => {
          const projectRoot = path.join(process.cwd(), `src/fixtures/${f}`);
          const datasource = new FileSystemManager(projectRoot);
          const cache = cacheInit(datasource);
          const { schema } = await builder.schema({ cache });

          const schemaString = printSchema(buildASTSchema(schema));

          // await fs
          //   .writeFileSync(path.join(projectRoot, "ast-schema.graphql"), schemaString)

          const schemaFile = await fs
            .readFileSync(path.join(projectRoot, "ast-schema.graphql"))
            .toString();

          expect(schemaFile).toEqual(schemaString);
        })
    );
  });
});
