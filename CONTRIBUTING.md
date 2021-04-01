## Getting started

Currently this is a monorepo built with Yarn V2 and Plug-n-Play. This is a more strict package manager so if it's too much friction we can always go back to Lerna.

You should :fingers_crossed: be able to just run these commands. (Please make a note of any hang-ups you ran into during this process)

```sh
# check yarn version, this repo ships with yarn so it should be 2.1.1
yarn -v
# if that doesn't show 2.1.1 it needs to be fixed. You can install the version manually https://yarnpkg.com/getting-started/install but you'll definitely need +2.0
yarn install
# build all the packages
yarn run build
# watch all packages
yarn run watch # NOTE: this isn't running the apps/demo for me so I've been running it from the `apps/demo` repo directly in a separate tab
# cd to apps/demo
# start the local filesystem GraphQL server
yarn dev
```

That should allow you to see 2 things: The GraphiQL playground at `http:localhost:4001/graphql` and the NextJS demo app at `http:localhost:3000/home`. Tina form changes should result in `content/pages/home.md` being changed.

## Release Workflow

> Note: we're trialing yarn v2 so this is experimental. We're confident in the Lerna setup but it leaves a lot of gaps - hoping yarn v2 fills them but if it's too much trouble we'll scrap this.

When making edits to a package, manually run `yarn version <patch | minor | major> --deferred`. This will populate a `version` file in the `.yarn` folder which will keep track of what type of version bump should be applied during the next release. Your commit message has nothing to do with the release (not using Conventional Commits here).

### CI check versions

Since you're now responsible for manually maintaining your package updates that can be cumbersome, it'd be easy to forget that your change would require an upstream package to bump it's version. For that reason there's `yarn version check` and `yarn version check --interactive`. CI will fail when a "release strategy" hasn't been set for a package with changes or with dependency changes. You can see which packages need to be addressed in `--interactive` mode.

### Explanation

#### Versioning is deferred

https://yarnpkg.com/features/release-workflow#deferred-versioning

In order to prevent inconsistencies in versioning we'll push changes manually - not relying on Conventional Commits as they are tough to keep track of and don't typically trace very well through a changelog. The hope here is that `yarn version apply --all` will still allow us to version things in a single commit, the difference being the changelog messages need to be hand-written. There's some work being done on this, but I'm not sure the Conventional Commit approach makes things any more clear. Tracking this issue for context (https://github.com/yarnpkg/berry/issues/1510)
