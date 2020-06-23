import { graphql } from "graphql";
import Cors from "cors";
import {
  buildSchema as buildForestrySchema,
  FileSystemManager,
} from "@forestry/graphql";
import { generate } from "../../graphql/codegen";

const dataSource = new FileSystemManager();

export default async (req, res) => {
  // Forestry-Config header is supplied by bin.js
  // packages/forestry-graphql-client/bin.js
  const { headers } = req;
  const forestryConfig = JSON.parse(headers["Forestry-Config"]);

  const { schema, documentMutation } = await buildForestrySchema(
    forestryConfig,
    dataSource
  );

  const { query, operationName, variables } = req.body;

  // generate("some/path", schema);

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
