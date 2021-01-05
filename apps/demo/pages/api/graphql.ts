import { gql } from "@forestryio/gql";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const { query, variables } = req.body;

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  const json = await gql({
    projectRoot: process.cwd(),
    query,
    variables,
  });
  res.end(JSON.stringify(json));
}
