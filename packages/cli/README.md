# CLI

The CLI can be used to setup your local site with Forestry.io configuration.

## Getting started

Npm:

`npm install @forestryio/cli`

Yarn:

`yarn add @forestryio/cli`

## Usage

Arguments wrapped in `[]` in the command name are optional. If not provided, the user will be prompted for their values.
E.g:

## Help

You can get help on any command with `-h` or `--help`.

e.g: `yarn forestry types:gen --help`

This will describe how to use the types:gen command.

## Commands

## Development

To run this project locally in another directory, you can create a symlink by running

```
npm link
```

Then Forestry can be run in another directory by running:

```
forestry <commands>
```

_Alternatively, the CLI can be added to a project instead of being used globally._

To run the command locally in this project directory, you can run:

```
yarn forestry <commands>
```

### .env

To access some third party services, you will need to add a .env file.
Use the .env.example to fill in the example keys.
