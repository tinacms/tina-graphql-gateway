import path from "path";
import fs from "fs";
import { schemaBuilder } from "./schema-builder";
import { FilesystemDataSource } from "./datasources/filesystem-manager";
import { printSchema } from "graphql";

describe("Schema builder", () => {
  test("does it", async () => {
    const projectRoot = path.join(process.cwd(), "src/fixtures/project1");
    const output = await fs
      .readFileSync(path.join(projectRoot, "schema.gql"))
      .toString();

    const datasource = FilesystemDataSource(projectRoot);
    const schema = await schemaBuilder({ datasource });
    // expect(printSchema(schema)).toEqual(output);
  });
});
