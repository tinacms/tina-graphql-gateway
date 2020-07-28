## Introduction

This "@forestryio/client" package allows you to access your datasource through a GraphQL adapter.
You might want to use this for a few reasons:

### Consistent GraphqQL API regardless of your datsource

If your content is backed by Git, you might want to use your local content in development. With your production Cloud Editing Environment, you can use our "Tina Teams" server to fetch your content. The API for both backends will be consistent, so you can easily switch between the two datasources without changing your site's code.

### GraphQL Typescript type generation

With the "@forestryio/cli" package, you can generate typescript types based on your schema. Your schema will be defined within your site in the **.forestry** folder

### Prerequisites

This guide assumes you have a working NextJS site.
You can create you quickly with:

```bash
npx create-next-app nextjs-blog --use-npm --example "https://github.com/vercel/next-learn-starter/tree/master/basics-final"
```

## Install

### Client package

```bash
npm install --save @forestryio/client
```

or

```bash
yarn add @forestryio/client
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
yarn add --dev @forestryio/cli
```

This CLI performs a few functions:

- Generating GraphQL queries (and optional typescript types) based on your site's schema.
- Auditing your site schema and checking for errors.
- Running a GraphQL server using the built-in Filesystem adapter.

For full documentation of the CLI, see [here](https://github.com/forestryio/graphql-demo/tree/client-documentation/packages/cli)

## Implementation

Let's start by creating a simple dummy piece of content. We'll eventually try loading this file from our graphql server. 

**/_posts/welcome.md**
```md
---
title: This is my post
---
```

### Define Schema

Your site's schema is defined within the **<site_root>/.forestry** directory

You'll need to setup a few configuration files:

#### .forestry/config.js

This file specifies where we'll load our data. It should look like:

```js
// config.js
module.exports = {
  serverURL: "http://localhost:4001/api/graphql",
};
```

#### .forestry/front_matter/templates/post.yml

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
  - _posts/welcome.md # This keeps reference to all the pages using this template
```

#### .forestry/settings.yml

```yml
---
new_page_extension: md
auto_deploy: false
admin_path:
webhook_url:
sections:
  - type: directory
    path: posts # replace this with the relative path to your content section
    label: Posts
    create: documents
    match: "**/*.md"
    new_doc_ext: md
    templates:
      - post # replace this with your template filename name
upload_dir: public/uploads
public_path: "/uploads"
front_matter_path: ""
use_front_matter_path: false
file_template: ":filename:"
```

#### Creating the GraphQL server

Now that we've defined our schema, let's use the CLI to setup a GraphQL server for our site to use.

From the cli in your site root, run:

```bash
yarn tina-gql schema:gen-query --typescript
```

This should create two files:
`.forestry/query.js` & `.forestry/types.ts`

Now let's start our server! run:

```bash
yarn tina-gql server:start
```

To verify that everything is up an running, you can visit `http://localhost:4001/api/graphql` and navigate through your schema.

[![Tina Graphql Query](https://res.cloudinary.com/forestry-demo/image/upload/v1595869546/TinaCMS/graphiql.png)](https://tinacms.org/)

You can use the query from your **/.forestry/query.js**, add a **path** query variable, and click the "Run Query" button to verify that your graphql server is configured properly.

Now that we have a working GraphQL server with our local content, let's use it within our site.

_We will want to keep this graphql server running in its own tab to serve content for our local site_

### Using the data within our Next.JS site

Install the TinaCMS depedencies:

```bash
yarn add tinacms styled-components
```

or

```bash
npm install tinacms styled-components
```

In your site root, add TinaCMS & register the ForestryClient like so:

```tsx
// _app.jsx
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
  sidebar: {
    hidden: false,
  },
});
```

If your site uses SSR, you may also need to add this to your **\_document.js** to handle tinacms's Styled Components

```js
// pages/_document.js
import Document from "next/document";
import { ServerStyleSheet } from "styled-components";

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
      };
    } finally {
      sheet.seal();
    }
  }
}
```

By registering the ForestryClient globally, we can now use it within our pages to fetch content.

```tsx
// pages/posts/welcome.jsx

import { useForestryForm, ForestryClient } from "@forestryio/client";
import config from "../.forestry/config";
import { usePlugin } from "tinacms";
import query from "../.forestry/query";

import 'isomorphic-unfetch' // polyfill workaround

const URL = config.serverURL;

export const getStaticProps = async () => {
  const path = `_posts/welcome.md`;
  const client = new ForestryClient({ serverURL: URL, query });
  const response = await client.getContent({
    path,
  });

  return { props: { path, response } };
};

const Home = (props) => {
  const [formData, form] = useForestryForm(props.response, config.serverURL);
  usePlugin(form);

  return (
    <div>
      <h1>{formData.data.title}</h1>
    </div>
  );
};
```

And that's it! Try making some changes and saving.

Next steps:

- Make changes to our data-model, and verify our templates with `$ tina-gql schema:audit`
- Setup build server to run in production
- Configure your site to use the `Tina Teams` API in your hosted Cloud Editing Environment
