import express from "express";
import graphqlHTTP from "express-graphql";
import cors from "cors";
import { buildSchema } from "@forestryio/graphql";
import { DatabaseManager } from "./databaseManager";
require("dotenv").config();

const dataSource = new DatabaseManager();

const app = express();
app.use(cors());
app.use(
  "/graphql",
  graphqlHTTP(async () => {
    // FIXME: this should probably come from the request, or
    // maybe in the case of the DatabaseManager it's not necessary
    const config = {
      rootPath: "",
      sectionPrefix: "content/",
    };
    const { schema, documentMutation } = await buildSchema(config, dataSource);

    return {
      schema,
      rootValue: {
        document: documentMutation,
      },
      context: { dataSource },
    };
  })
);
app.listen(4002);
