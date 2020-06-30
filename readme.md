# Structure

There is an `apps/demo` which is a nextjs app and then everything else is in `/packages`:

### @forestry/graphql

Environment: `node`

Provides `buildSchema` function which takes a `DataSource` instance and provides a schema based on the data it finds. It also provides the `FileSystemManager` datasource as well as the `DataSource` interface.

### @forestry/client

Environment: `browser`

Provides React hooks for fetching and building the Tina form. It also exposes a CLI for things like generating Typescript types for your content models.

### @forestry/teams

Environment: `node`

This package should eventually be moved out of this repo. Utilitizes `buildSchema` by passing a database `DataSource` in for Forestry.io compatibility.

### @forestry/build

Just a package builder, uses Rollup.

### Getting started

Currently this is a monorepo built with Yarn V2, it might just be easier to break this out due to issues with monorepo DX but for now I've kept it in place.

To use, make sure you've got yarn V2 installed [by following these instructions](https://yarnpkg.com/getting-started/install). Then:

```sh
yarn install
# build all the packages
yarn run build
# watch all packages, (including the NextJS demo app)
yarn run watch
# cd to apps/demo
# start the local GraphQL server
yarn forestry:start
```

## GraphQL Server

`yarn forestry:serve` will start up the GraphQL server, you'll be able to inspect it in more detail at `http://localhost:4001/graphql`.

## NextJS App

`yarn dev` runs the NextJS app and doesn't do much right now, just wraps the app in Tina and fetchs the Forestry query from GraphQL, and applies the provided Typescript type to the result. Note that the `query.ts` and `types.ts` files are generated from the `@forestry/graphql` package automatically (even though the `query.ts` is manually maintained).

### The `.forestry` folder

This demo uses a couple of extra things from the `.forestry` folder:

- **config.js** - This is where we can put site-specific configurations.
- **types.ts** - This is auto-generated from the Forestry GraphQL package, you can see it being used in the `[page].tsx` file.
- **query.ts** - This is manually maintained for now with the goal for it to be generated automatically in the future. It's the actual GraphQL query that gets run to generate all the data for the page. See the Gotchas section for troubleshooting.

---

### Using with Tina

To use this with your local Tina repo look in the `demo/next.config.js` file, ensure the paths resolve to your local Tina install and you've built all the necessary Tina packages.

### Using this repo with the Forestry.io app

For demonstation purposes I've put the demos in the `apps` folder. But the Forestry app needs the `.forestry` files to be in the repo root so you can't hook this repo up to the app as it stands.
