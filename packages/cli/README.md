# CLI

The CLI can be used to setup your local site with Forestry.io configuration.

## Getting started

Npm:

`npm install -g @forestryio/cli`

Yarn:

`yarn global add @forestryio/cli`

## Usage

Arguments wrapped in `[]` in the command name are optional. If not provided, the user will be prompted for their values.
E.g:

## Help

You can get help on any command with `-h` or `--help`.

e.g: `forestry sites --help`

This will describe how to use all the commands in the `sites` context

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

To run the command locally in this project directory, you can run:

```
./bin/forestry <commands>
```

### .env

To access some third party services, you will need to add a .env file.
Use the .env.example to fill in the example keys.
