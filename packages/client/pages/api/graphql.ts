import { graphql } from "graphql";
import Cors from "cors";
import {
  buildSchema as buildForestrySchema,
  FileSystemManager,
} from "@forestryio/graphql";

export default async (req, res) => {
  // Forestry-Config header is supplied by bin.js
  // packages/client/bin.js
  const { headers } = req;
  const forestryConfig = JSON.parse(headers["Forestry-Config"]);

  const dataSource = new FileSystemManager(forestryConfig.rootPath);

  const { schema, updateDocumentMutation } = await buildForestrySchema(
    forestryConfig,
    dataSource
  );

  const { query, operationName, variables } = req.body;

  const response = await graphql(
    schema,
    query,
    { updateDocument: updateDocumentMutation },
    { dataSource },
    variables,
    operationName
  );

  await cors(req, res);

  return res.end(JSON.stringify(response));
};

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
