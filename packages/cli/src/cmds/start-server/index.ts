import express from "express";
import { graphqlHTTP } from "express-graphql";
import {
  FileSystemManager,
  buildSchema as buildForestrySchema,
} from "@forestryio/graphql";
import { successText } from "../../utils/theme";

const PORT = 4001;
const GRAPHQL_ENDPOINT = "/api/graphql";

export async function startServer() {
  const app = express();

  const rootPath = process.cwd();
  const forestryConfig = {
    serverURL: `http://localhost:${PORT}/api/graphql`,
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

  app.listen(PORT);

  const baseURL = `http://localhost:${PORT}`;

  console.log(
    `Graphql server ready at: ${successText(baseURL + GRAPHQL_ENDPOINT)}`
  );
}
