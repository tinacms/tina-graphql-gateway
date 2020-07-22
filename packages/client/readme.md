## Introduction

This "@forestryio/client" package allows you to access your datasource through a GraphQL adapter.
You might want to use this for a few reasons:

### Consistent data querying through a consistent GraphqQL API

If your content is backed by Git, you might want to use your local content in development. With your production Cloud Editing Environment, you can use our "Tina Teams" server to fetch your content. The API for both backends will be consistent, so you can easily switch between the two datasources without changing your site's code.

### GraphQL Typescript type generation

With the "@forestryio/cli" package, you can generate typescript types based on your schema.

## Getting started

## Install

```
npm install --save @forestryio/client
```

or

```
yarn install @forestryio/client
```

You'll also likely want to install our CLI to help with development:

```
npm install --save-dev @forestryio/cli
```

or

```
yarn install --dev @forestryio/cli
```

## Client package

This package provides a few things:

- A `ForestryClient` class (which can be used as a TinaCMS API plugin).
- A `useForestryForm` helper.

###

## CLI package

- The GraphQL explorer can be accessed at localhost:4001
- The GraphQL API Server can be accessed at localhost:4001/api/graphql
- Writes the `types.ts` to the consuming app's `.forestry` folder
