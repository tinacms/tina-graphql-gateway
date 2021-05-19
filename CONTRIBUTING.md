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
