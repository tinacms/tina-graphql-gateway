import { githubRoute } from "@forestryio/gql";

export default async function handler(req, res) {
  const { query, variables } = req.body;

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  const json = await githubRoute({
    rootPath: "apps/demo",
    accessToken: process.env.GITHUB_ACCESS_TOKEN,
    owner: process.env.GIT_REPO_OWNER,
    repo: process.env.GIT_REPO_SLUG,
    branch: process.env.GIT_COMMIT_REF,
    query,
    variables,
  });
  console.log(json);
  res.end(JSON.stringify(json));
}
