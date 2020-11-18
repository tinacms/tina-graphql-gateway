module.exports = {
  projects: {
    app: {
      schema: ["./apps/demo/.tina/schema.gql"],
      documents: "**/*.{graphql,js,ts,jsx,tsx}",
      extensions: {
        endpoints: {
          default: {
            url: "http://localhost:4001/graphql",
          },
        },
      },
    },
  },
};
