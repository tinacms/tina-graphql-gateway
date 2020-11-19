module.exports = {
  projects: {
    authorProblem: {
      schema: ["./apps/author-problem/.tina/schema.gql"],
      documents: "./apps/author-problem/**/*.{graphql,js,ts,jsx,tsx}",
    },
    app: {
      schema: ["./apps/demo/.tina/schema.gql"],
      documents: "./apps/demo/**/*.{graphql,js,ts,jsx,tsx}",
    },
  },
};
