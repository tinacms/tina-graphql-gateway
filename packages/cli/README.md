# CLI

The "Tina Graphql-Gateway CLI" can be used to set up your project with Tina Cloud configuration, and run a local version of the Tina Cloud content-api (using your file system's content).

## Getting started

Npm:

```bash
npm install --save-dev tina-graphql-gateway-cli
```

Yarn:

```bash
yarn add --dev tina-graphql-gateway-cli
```

## Usage

Arguments wrapped in `[]` in the command name are optional.

## Help

You can get help on any command with `-h` or `--help`.

e.g:

```bash
yarn tina-gql schema:gen-query --help
```

This will describe how to use the schema:gen-query command.

## Commands

### tina-gql schema:gen-query \[options\]

Generate a GraphQL query for your site's schema

#### Options

--typescript Include this option to also generate typescript types for your schema

### tina-gql schema:audit \[options\]

Check for **.tina/front_matter/templates** folder for any issues.

#### Options

--path <tinaPath> Specify a relative path to the .tina folder (eg. my-site)

### tina-gql server:start \[options\]

Start a GraphQL server using your Filesystem's content as the datasource.

#### Options

--port <port> Specify a port to run the server on. (default 4001)

## Development

To run this project locally in another directory, you can create a symlink by running

```bash
npm link
```

Then `tina-gql` can be run in another directory by running:

```bash
tina-gql <commands>
```

_Alternatively, the CLI can be added to a project instead of being used globally._

To run the command locally in this project directory, you can run:

```bash
yarn tina-gql <commands>
```

### .env

To access some third party services, you will need to add a .env file.
Use the .env.example to fill in the example keys.
