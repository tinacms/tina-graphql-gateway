## Client package

This package does a few things

- Provides `forestryFetch` and `useForestryForm` components.
- Exposes a bin `yarn forestry:serve` which starts up the GraphQL server and exposes a GraphiQL explorer
  - The GraphQL explorer can be accessed at localhost:4001
  - The GraphQL API Server can be accessed at localhost:4001/api/graphql
- Writes the `types.ts` to the consuming app's `.forestry` folder
