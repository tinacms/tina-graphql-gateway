import path from "path";
import fs from "fs";
import { schemaBuilder } from "./schema-builder";
import { graphqlInit } from "./graphql";
import { FilesystemDataSource } from "./datasources/filesystem-manager";
import { parse, buildSchema } from "graphql";

describe("Document Resolver", () => {
  test("Receives a path and returns the request document object", async () => {
    const projectRoot = path.join(process.cwd(), "src/fixtures/project1");
    // Don't rely on these, they're built by the schema builder test
    const query = await fs
      .readFileSync(path.join(projectRoot, "query.gql"))
      .toString();

    const datasource = FilesystemDataSource(projectRoot);
    // const schema2 = await schemaBuilder({ datasource });
    const schema = buildSchema(
      await fs.readFileSync(path.join(projectRoot, "temp.gql")).toString()
    );

    const contentPath = "posts/1.md";
    // const contentPath = 'authors/homer.md'
    const res = await graphqlInit({
      schema,
      source: query,
      contextValue: { datasource },
      variableValues: { path: contentPath },
    });
    if (res.errors) {
      res.errors.map((error) =>
        console.error({
          name: error.name,
          message: error.message,
        })
      );
    }
    await fs.writeFileSync(
      path.join(projectRoot, "result.json"),
      JSON.stringify(res, null, 2)
    );
  });
});
