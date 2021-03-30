# _tina-grapqhl-gateway_

This monorepo contains the _tina-graphql-gateway_ and _tina-graphql-gateway-cli_ packages, which enable [Tina](https://tina.io)-powered websites to use Tina's hosted Content API.

## Structure

The `apps/` folder contains a demo Next.js application (located in `apps/demo`) that can be used to test changes to the packages in this monorepo.

The `packages/` folder contains the NPM packages that are published from this monorepo.

## Packages

### _tina-graphql-gateway_

Environment: `browser`

Provides React hooks for fetching and building the Tina form. It also exposes a CLI for things like generating Typescript types for your content models.

### _tina-graphql-gateway-cli_

Environment: `node`

Provides `buildSchema` function which takes a `DataSource` instance and provides a schema based on the data it finds. It also provides the `FileSystemManager` datasource as well as the `DataSource` interface.

## How to Run This Project

See the [contributor docs](./CONTRIBUTING.md) for guidance on how to install and run this project.

---

## Using with Tina

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

## Managing License Headers

All _.js, _.ts, and \*.tsx files require a license header to be present.

### Add License

To add the license to a file, run the following command at the project root:

```bash
yarn license:add
```

This will search through the project for any files that requires a header and add it if it isn't already present.

### Delete License

To remove all license headers: at the project root run:

```bash
yarn license:delete
```

This will search the project for files that contain a license header and subsequently removes the header from them.

### Update License

When the license needs to be changed, first run the following command at the root of the project:

```bash
yarn license:delete
```

Then you may edit the **scripts/license.txt** file. Once complete, run the following command at the root of the project to add the new license to the required files:

```bash
yarn license:add
```
