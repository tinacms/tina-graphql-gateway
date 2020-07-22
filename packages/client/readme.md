## Introduction

This "@forestryio/client" package allows you to access your datasource through a GraphQL adapter.
You might want to use this for a few reasons:

### Consistent data querying of dynamic datasource through a GraphqQL API

If your content is backed by Git, you might want to use your local content in development. With your production Cloud Editing Environment, you can use our "Tina Teams" server to fetch your content. The API for both backends will be consistent, so you can easily switch between the two datasources without changing your site's code.

### GraphQL Typescript type generation

With the "@forestryio/cli" package, you can generate typescript types based on your schema.

## Install

### Client package

```bash
npm install --save @forestryio/client
```

or

```bash
yarn install @forestryio/client
```

This package provides a few things:

- A `ForestryClient` class (which can be used as a TinaCMS API plugin).
- A `useForestryForm` helper.

### CLI package

You'll also likely want to install our CLI to help with development:

```bash
npm install --save-dev @forestryio/cli
```

or

```bash
yarn install --dev @forestryio/cli
```

This CLI performs a few functions:

- Generating GraphQL queries (and optional typescript types) based on your site's schema.
- Auditing your site schema and checking for errors.
- Running a GraphQL server using the built-in Filesystem adapter.

For full documentation of the CLI, see [here](https://github.com/forestryio/graphql-demo/tree/client-documentation/packages/cli)

## Implementation

### Define Schema

Your site's schema is defined within the `<site_root>/.forestry` directory

You'll need to setup a few files:

#### .forestry/.config

This file specifies where we'll load our data. It should look like:

```js
// .config
module.exports = {
  serverURL: "http://localhost:4001/api/graphql",
};
```

#### .forestry/front_matter/templates

This is where your templates live. These represent your data's content model.
Let's wire one up:

```yml
---
label: Post
hide_body: false
display_field: title
fields:
  - name: title
    type: text
    config:
      required: false
    label: Title
pages:
  - content/posts/welcome.md # This keeps reference to all the pages using this template
```

#### Creating the GraphQL server

Now that we've defined our schema, let's use the CLI to setup a GraphQL server for our site to use.

From the cli in your site root, run:

```bash
yarn forestry schema:gen-query --typescript
```

This should create two files:
`.forestry/query.js` & `.forestry/types.ts`

Now let's start our server! run:

```bash
yarn forestry server:start
```

To verify that everything is up an running, you can visit `http://localhost:4001/api/graphql` and navigate through your schema.

Now that we have a working GraphQL server with our local data, let's use it within our site

### Using the data within our Next.JS site

This section assumes you have a working Next.JS site.

In your site root, add TinaCMS & register the ForestryClient like so:

```tsx
import React from "react";
import { withTina } from "tinacms";
import { ForestryClient } from "@forestryio/client";
import config from "../.forestry/config";
import query from "../.forestry/query";

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default withTina(MyApp, {
  apis: {
    forestry: new ForestryClient({
      serverURL: config.serverURL,
      query,
    }),
  },
});
```

By registering the ForestryClient globally, we can now use it within our pages to fetch content.

```tsx
// content/posts/welcome.md

import { useForestryForm } from "@forestryio/client";
import config from "../.forestry/config";
import { usePlugin } from "tinacms";

const Home = (props) => {
  const [formData, form] = useForestryForm(props.response, config.serverURL);
  usePlugin(form);

  return (
    <div>
      <h1>{formData.document.title}</h1>
    </div>
  );
};
```

And that's it! Try making some changes and saving.

Next steps:

- Make changes to our data-model, and verify our templates with `$ forestry schema:audit`
- Setup build server to run in production
- Configure your site to use the `Tina Teams` API in your hosted Cloud Editing Environment
