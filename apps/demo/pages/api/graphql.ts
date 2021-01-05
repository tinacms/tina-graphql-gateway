import { gql } from "@forestryio/gql";

export default async function handler(req, res) {
  const { query, variables } = req.body;

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");

  console.log("cw", process.cwd());

  const json = await gql({
    projectRoot: ".",
    query,
    variables,
  });
  res.end(JSON.stringify(json));
}
