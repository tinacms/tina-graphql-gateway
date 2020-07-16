import express from "express";
import { graphqlHTTP } from "express-graphql";
import {
  FileSystemManager,
  buildSchema as buildForestrySchema,
} from "@forestryio/graphql";
import { successText } from "../../utils/theme";

const GRAPHQL_ENDPOINT = "/api/graphql";

interface Options {
  port?: number;
}

export async function startServer(_ctx, _next, { port = 4001 }: Options) {
  const app = express();

  const rootPath = process.cwd();
  const forestryConfig = {
    serverURL: `http://localhost:${port}/api/graphql`,
    rootPath,
    siteLookup: "",
  };
  const dataSource = new FileSystemManager(forestryConfig.rootPath);

  app.use(
    GRAPHQL_ENDPOINT,
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

  app.listen(port);

  const baseURL = `http://localhost:${port}`;

  console.log(
    `Graphql server ready at: ${successText(baseURL + GRAPHQL_ENDPOINT)}`
  );
}
