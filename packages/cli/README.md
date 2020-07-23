# CLI

The CLI can be used to setup your local site with Forestry.io configuration.

## Getting started

Npm:

```bash
npm install --save-dev @forestryio/cli
```

Yarn:

```bash
yarn add --dev @forestryio/cli
```

## Usage

Arguments wrapped in `[]` in the command name are optional.

## Help

You can get help on any command with `-h` or `--help`.

e.g: `yarn forestry schema:gen-query --help`

This will describe how to use the schema:gen-query command.

## Commands

### forestry gen-query \[options\]

Generate a GraphQL query for your site's schema

#### Options

--typescript Include this option to also generate typescript types for your schema

### forestry schema:audit \[options\]

Check for **.forestry/front_matter/templates** folder for any issues.

#### Options

--path <forestryPath> Specify a relative path to the .forestry folder (eg. my-site)

### forestry server:start \[options\]

Start a GraphQL server using your Filesystem's content as the datasource.

#### Options

--port <port> Specify a port to run the server on. (default 4001)

## Development

To run this project locally in another directory, you can create a symlink by running

```bash
npm link
```

Then Forestry can be run in another directory by running:

```bash
forestry <commands>
```

_Alternatively, the CLI can be added to a project instead of being used globally._

To run the command locally in this project directory, you can run:

```bash
yarn forestry <commands>
```

### .env

To access some third party services, you will need to add a .env file.
Use the .env.example to fill in the example keys.
