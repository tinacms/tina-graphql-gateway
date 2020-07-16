import express from "express";
import { graphql } from "graphql";
import Cors from "cors";
import bodyParser from "body-parser";

import {
  FileSystemManager,
  buildSchema as buildForestrySchema,
} from "@forestryio/graphql";

const PORT = 4001;

export async function startServer() {
  const app = express();

  app.use(bodyParser.json());

  app.use("/api/graphql", async function (req, res, next) {
    const rootPath = process.cwd();
    const forestryConfig = {
      serverURL: `http://localhost:${PORT}/api/graphql`,
      rootPath,
      siteLookup: "",
    };

    const dataSource = new FileSystemManager(forestryConfig.rootPath);

    const { schema, documentMutation } = await buildForestrySchema(
      forestryConfig,
      dataSource
    );

    const { query, operationName, variables } = req.body;

    const response = await graphql(
      schema,
      query,
      { document: documentMutation },
      { dataSource },
      variables,
      operationName
    );

    await cors(req, res);

    return res.end(JSON.stringify(response));
  });

  app.listen(PORT);

  console.log(`Server ready on http://localhost:${PORT}`);
}

const cors = (req, res) => {
  new Promise((resolve, reject) => {
    Cors({
      origin: "*",
      methods: ["GET", "POST", "OPTIONS"],
    })(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};
