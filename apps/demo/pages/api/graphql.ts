import { gql } from "@forestryio/gql";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const { query, variables } = req.body;

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");

  console.log("cw", process.cwd());
  console.log("dir", await fs.readdirSync(process.cwd()));
  console.log("path", await fs.readdirSync(path.join(process.cwd(), ".tina")));

  const json = await gql({
    projectRoot: ".",
    query,
    variables,
  });
  res.end(JSON.stringify(json));
}
