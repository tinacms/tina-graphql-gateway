# Structure

There is an `apps/demo` folder which is a nextjs app and then everything else is in `packages`:

### @forestry/graphql

Environment: `node`

Provides `buildSchema` function which takes a `DataSource` instance and provides a schema based on the data it finds. It also provides the `FileSystemManager` datasource as well as the `DataSource` interface.

### @forestry/client

Environment: `browser`

Provides React hooks for fetching and building the Tina form. It also exposes a CLI for things like generating Typescript types for your content models.

### @forestry/teams

Environment: `node`

This package should eventually be moved out of this repo. Utilitizes `buildSchema` by passing a **database** `DataSource` in for Forestry.io compatibility.

### @forestry/build

Just a package builder, uses Rollup.

### Getting started

Currently this is a monorepo built with Yarn V2 and Plug-n-Play. This is a more strict package manager so if it's too much friction we can always go back to Lerna.

You should :fingers_crossed: be able to just run these commands. (Please make a note of any hang-ups you ran into during this process)

```sh
# check yarn version, this repo ships with yarn so it should be 2.0.0-rc.36
yarn -v
# if that doesn't show 2.0.0-rc.36 it needs to be fixed. You can install the version manually https://yarnpkg.com/getting-started/install but you'll definitely need +2.0
yarn install
# build all the packages
yarn run build
# watch all packages, (including the NextJS demo app?)
yarn run watch # NOTE: this isn't running the apps/demo for me so I've been running it from the `apps/demo` repo directly in a separate tab
# cd to apps/demo
# start the local filesystem GraphQL server
yarn forestry:start
```

That should allow you to see 2 things: The GraphiQL playground at `http:localhost:4001/graphql` and the NextJS demo app at `http:localhost:3000/home`. Tina form changes should result in `content/pages/home.md` being changed.

## Using the **database** GraphQL Server Locally

To use the Database version, ensure you have a database site that matches your `.forestry` folder config. Your site `lookup` attribute should be `qms5qlc0jk1o9g` for now.

Change the values in `apps/demo/.forestry/config.js` so that `serverURL` points to the Express process ("http://localhost:4002/api/graphql").

Ensure that you've populated your own `.env` file in `packages/teams/.env`.

From the `packages/teams` directory: `yarn forestry:serve` will start up the GraphQL server, you'll be able to inspect it in more detail at `http://localhost:4001/graphql`.

### The `.forestry` folder

This demo uses a couple of extra things from the `.forestry` folder:

- **config.js** - This is where we can put site-specific configurations.
- **types.ts** - This is auto-generated from the `@forestry/client` package, you can see it being used in the `[page].tsx` file.
- **query.js** - This is also auto-generated from the `@forestry/client` package

---

### Using with Tina

To use this with your local Tina repo look in the `demo/next.config.js` file, ensure the paths resolve to your local Tina install and you've built all the necessary Tina packages.

### Using this repo with the Forestry.io app

For demonstation purposes I've put the demos in the `apps` folder. But the Forestry app needs the `.forestry` files to be in the repo root so you can't hook this repo up to the app as it stands. We have another repo [here](https://github.com/forestryio/demo-tina-blocks-graphql) which utilizes the same `.forestry` config

## Using these packages externally

These packages are currently published to Github Packages, with plans to open-source at some point. Until then, ensure your `.npmrc` is setup for fetching packages with the `@forestryio` scope from Github:

```
//npm.pkg.github.com/:_authToken=<My-Github-Personal-Access-Token-Here>
@forestryio:registry=https://npm.pkg.github.com/
always-auth=true
registry=http://registry.npmjs.org/ # All other packages
```
