import express from "express";
import { graphql } from "graphql";
import Cors from "cors";
import bodyParser from "body-parser";
import { graphqlHTTP } from "express-graphql";
import {
  FileSystemManager,
  buildSchema as buildForestrySchema,
} from "@forestryio/graphql";

const PORT = 4001;

export async function startServer() {
  const app = express();

  app.use(bodyParser.json());

  const rootPath = process.cwd();
  const forestryConfig = {
    serverURL: `http://localhost:${PORT}/api/graphql`,
    rootPath,
    siteLookup: "",
  };
  const dataSource = new FileSystemManager(forestryConfig.rootPath);

  app.use(
    "/api/graphql",
    graphqlHTTP(async () => {
      // FIXME: this should probably come from the request, or
      // maybe in the case of the ElasticManager it's not necessary?
      const config = {
        rootPath: "",
        siteLookup: "qms5qlc0jk1o9g",
      };
      const { schema, documentMutation } = await buildForestrySchema(
        config,
        dataSource
      );

      return {
        schema,
        rootValue: {
          document: documentMutation,
        },
        context: { dataSource },
        graphiql: true,
      };
    })
  );

  app.listen(PORT);

  console.log(`Server ready on http://localhost:${PORT}`);
}
