import { graphql, printSchema } from "graphql";
import Cors from "cors";
import {
  buildSchema as buildForestrySchema,
  FileSystemManager,
} from "@forestryio/graphql";

export default async (req, res) => {
  // Forestry-Config header is supplied by bin.js
  // packages/forestry-graphql-client/bin.js
  const { headers } = req;
  const forestryConfig = JSON.parse(headers["Forestry-Config"]);

  const dataSource = new FileSystemManager(forestryConfig.rootPath);

  const { schema, documentMutation } = await buildForestrySchema(
    forestryConfig,
    dataSource
  );
  // Useful for debugging
  // console.log(printSchema(schema));
  // await fs.writeFileSync("./meh.gql", printSchema(schema));

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
