## Getting started

Currently this is a monorepo built with Yarn V2 and Plug-n-Play. This is a more strict package manager so if it's too much friction we can always go back to Lerna.

You should :fingers_crossed: be able to just run these commands. (Please make a note of any hang-ups you ran into during this process)

```sh
# check the node version, this repo only supports node 14.x.x at the moment
node -v
# check yarn version, this repo ships with yarn so it should be 2.4.1
yarn -v
# it should show 2.4.1, you'll definitely need +2.0
yarn install
# build all the packages
yarn run build
# watch all packages
yarn run watch
# cd to apps/demo
# start the local filesystem GraphQL server
yarn dev
```

That should allow you to see 2 things: The GraphiQL playground at `http:localhost:4001/graphql` and the NextJS demo app at `http:localhost:3000/home`. Tina form changes should result in `content/pages/home.md` being changed.

## Creating a PR

> Note: this is experimental for now, we'll see how we like [changesets]() before falling back to conventional commits

When your work is ready, from the root of the repository run `yarn changeset` and follow the prompts to select the packages you'd like to update. For more information on how to work with changesets read [their documentation](https://github.com/atlassian/changesets/blob/main/docs/adding-a-changeset.md)

Once your changeset has been generated, commit it as part of your work and push to Github. From there we'll know how to version the package when we do a release.

## Creating a beta release

`cd` into the package you want to release, append `-beta` to the `version` in it's `package.json`. Run `yarn version prerelease`, which will bump your version in the `package.json`. So if you had `0.1.1-beta`, it would become `0.1.1-beta.1`. Next, run `yarn npm publish --tag beta`.

To install this version `yarn add my-package@beta`. For users you do `yarn add my-package`, they won't get your beta version.

> Hint: there's no special meaning to the term `beta`, you can use whatever keyword you want

## Working with the GitHub Manager locally

In `packages/tina-graphql/src/index.ts`, replace:
```ts
const manager = new FileSystemManager({ rootPath: projectRoot })
```

with:

```ts
const manager = new GithubManager({
    rootPath: 'examples/tina-cloud-starter',
    accessToken: '<TOKEN>',
    owner: 'tinacms',
    repo: 'tina-graphql-gateway',
    ref: '<BRANCH>',
    cache: simpleCache,
  })
```
Use whichever branch you're currently working with, and generate and provide a GitHub personal access token with full permissions and SSO enabled with tinacms authorized. 

## Trying out changes to a package
### Local
If the changes affect local use of the packages (i.e. not the ContentAPI), use the tina-cloud-starter found in the examples directory of this repo. That starter will require a .env file with the following values:
```
NEXT_PUBLIC_ORGANIZATION_NAME=<ANYTHING YOU WANT>
NEXT_PUBLIC_TINA_CLIENT_ID=<ANYTHING YOU WANT>
NEXT_PUBLIC_USE_LOCAL_CLIENT=1
```

### Backend
If the changes you want to try out will be in the ContentAPI, then you will need to canary release your package changes. Ask somebody about how to do this.

## Misc
### Getting the starter to reference a different Identity API or ContentAPI
If you've made changes to the ContentAPI or Identity and you want the starter to use the different API, use these override env variables in the tina-cloud-starter:
```
IDENTITY_API_OVERRIDE=<URL TO IDENTITY>
CONTENT_API_OVERRIDE<URL TO CONTENTAPI>
```

### Import errors
Are you getting lots of import errors in VSCode and yet it builds fine? In VSCode try pressing cmd+shift+p, search for `select typescript version` and choose `use workspace version`.

