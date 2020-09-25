import path from "path";
import fs from "fs";
import { schemaBuilder } from "./schema-builder";
import { graphqlInit } from "./graphql";
import { FileSystemManager } from "./datasources/filesystem-manager";
import { parse, buildSchema } from "graphql";

describe("Document Resolver", () => {
  test("Receives a path and returns the request document object", async () => {
    const projectRoot = path.join(process.cwd(), "src/fixtures/project1");
    // Don't rely on these, they're built by the schema builder test
    const query = await fs
      .readFileSync(path.join(projectRoot, "query.gql"))
      .toString();

    const datasource = new FileSystemManager(projectRoot);
    const schema = await schemaBuilder({ datasource });
    // const schema = buildSchema(
    //   await fs.readFileSync(path.join(projectRoot, "temp.gql")).toString()
    // );

    const contentPath = "posts/1.md";
    // const contentPath = "authors/homer.md";
    const res = await graphqlInit({
      schema,
      source: query,
      contextValue: { datasource },
      variableValues: { path: contentPath },
    });
    if (res.errors) {
      res.errors.map((error) => console.error({ ...error }));
    }
    // console.log(res);
    // const json = await fs.readFileSync(path.join(projectRoot, "result.json"));
    // expect(res).toMatchObject(JSON.parse(json));
    await fs.writeFileSync(
      path.join(projectRoot, "result.json"),
      JSON.stringify(res, null, 2)
    );
  });
});
