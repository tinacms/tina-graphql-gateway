# Structure

There is an `apps/demo` folder which is a nextjs app and then everything else is in `packages`:

### tina-graphql-gateway-cli

Environment: `node`

Provides `buildSchema` function which takes a `DataSource` instance and provides a schema based on the data it finds. It also provides the `FileSystemManager` datasource as well as the `DataSource` interface.

### tina-graphql-gateway

Environment: `browser`

Provides React hooks for fetching and building the Tina form. It also exposes a CLI for things like generating Typescript types for your content models.

### Getting started

Currently this is a monorepo built with Yarn V2 and Plug-n-Play. This is a more strict package manager so if it's too much friction we can always go back to Lerna.

You should :fingers_crossed: be able to just run these commands. (Please make a note of any hang-ups you ran into during this process)

```sh
# check yarn version, this repo ships with yarn so it should be 2.1.1
yarn -v
# if that doesn't show 2.1.1 it needs to be fixed. You can install the version manually https://yarnpkg.com/getting-started/install but you'll definitely need +2.0
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

> NOTE: deprecated until we focus on the Teams repo.

To use the Database version, ensure you have a database site that matches your `.forestry` folder config. Your site `lookup` attribute should be `qms5qlc0jk1o9g` for now.

Set an environment variable called TINA_GQL_SERVER that points to the Express process (for local testing this is "http://localhost:4002/api/graphql")

### The `.forestry` folder

This demo uses a couple of extra things from the `.forestry` folder:

- **types.ts** - This is auto-generated from the `tina-graphql-gateway` package, you can see it being used in the `[page].tsx` file.
- **query.gql** - This is also auto-generated from the `tina-graphql-gateway` package. It's a reference and isn't needed.

---

### Using with Tina

To use this with your local Tina repo look in the `demo/next.config.js` file, ensure the paths resolve to your local Tina install and you've built all the necessary Tina packages.

### Using this repo with the Forestry.io app

For demonstation purposes I've put the demos in the `apps` folder. But the Forestry app needs the `.forestry` files to be in the repo root so you can't hook this repo up to the app as it stands. We have another repo [here](https://github.com/forestryio/demo-tina-blocks-graphql) which utilizes the same `.forestry` config

## Using these packages externally

These packages are currently published to NPM under the `forestryio` scope so you'll need to be sure you have access.

```
//npm.pkg.github.com/:_authToken=<My-NPM-Auth-Access-Token-Here>
@forestryio:registry=https://npm.pkg.github.com/
always-auth=true
registry=http://registry.npmjs.org/ # All other packages
```

### Yarn v2 repos ignore .npmrc

If you're setting up a new repo with yarn v2, note that it [won't respect any settings](https://yarnpkg.com/advanced/migration/#dont-use-npmrc-files) in your `.npmrc` - instead you can configure your settings in the .yarnrc.yml` file.

## Release Workflow

> Note: we're trialing yarn v2 so this is experimental. We're confident in the Lerna setup but it leaves a lot of gaps - hoping yarn v2 fills them but if it's too much trouble we'll scrap this.

When making edits to a package, manually run `yarn version <patch | minor | major> --deferred`. This will populate a `version` file in the `.yarn` folder which will keep track of what type of version bump should be applied during the next release. Your commit message has nothing to do with the release (not using Conventional Commits here).

### CI check versions

Since you're now responsible for manually maintaining your package updates that can be cumbersome, it'd be easy to forget that your change would require an upstream package to bump it's version. For that reason there's `yarn version check` and `yarn version check --interactive`. CI will fail when a "release strategy" hasn't been set for a package with changes or with dependency changes. You can see which packages need to be addressed in `--interactive` mode.

### Explanation

#### Versioning is deferred

https://yarnpkg.com/features/release-workflow#deferred-versioning

In order to prevent inconsistencies in versioning we'll push changes manually - not relying on Conventional Commits as they are tough to keep track of and don't typically trace very well through a changelog. The hope here is that `yarn version apply --all` will still allow us to version things in a single commit, the difference being the changelog messages need to be hand-written. There's some work being done on this, but I'm not sure the Conventional Commit approach makes things any more clear. Tracking this issue for context (https://github.com/yarnpkg/berry/issues/1510)

### Authentication

The demo project uses the Tina Teams authentication wrapper. To allow logging-in, you will need to add the following to your **.env**

```
SITE_CLIENT_ID=YOUR-CLIENT-ID-GOES-HERE
```

The `SITE_CLIENT_ID` can be retrieved by creating a client within Hydra:

Your request may look like:

```
POST http://localhost:4445/clients

{
  "client_name": "myapp5",
  "redirect_uris": [
    "http://localhost:3002/api/callback"
  ],
  "token_endpoint_auth_method": "none"
}
```

This should give a response with a `client_id` property.
