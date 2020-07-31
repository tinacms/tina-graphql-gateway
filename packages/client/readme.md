## Introduction

This package allows you to interact with an automatically generated GraphQL API using TinaCMS. Included are multiple GraphQL adapters that give you a consistent GraphQL API regardless of your datasource.

_For example, if your content is Git-backed, you might want to use your local content in development. While in your production Cloud Editing Environment, you can use our "Tina Teams" server to fetch your content. The API for both backends will be consistent, so you can easily switch between the two datasources without changing your site's code._

If you like to work in TypeScript, the [@forestry/cli](https://github.com/forestryio/graphql-demo/tree/master/packages/cli) package can generate types using the same schema definition that the GraphQL adapters will use.

## Install

### Prerequisites

This guide assumes you have a working NextJS site. You can create one quickly with:

```bash
npx create-next-app --example blog-starter-typescript blog-starter-typescript-app
```

or

```bash
yarn create next-app --example blog-starter-typescript blog-starter-typescript-app
```

### Install the client package

This package provides you with:

- A `ForestryClient` class (which you can use as a TinaCMS API Plugin), that takes care of all interaction with the GraphQL server.
- A `useForestryForm` hook, that you can use to hook into the Tina forms that let you edit your content.

```bash
npm install --save @forestryio/client
```

or

```bash
yarn add @forestryio/client
```

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

- Generates GraphQL queries (and optionally TypeScript types) based on your content's schema.
- Auditing your content's schema and checking for errors.
- Running a GraphQL server using the built-in filesystem adapter.

For full documentation of the CLI, see [here].(https://github.com/forestryio/graphql-demo/tree/client-documentation/packages/cli)

## Implementation

We'll show how to use this package in a NextJS site

### Create Dummy Content

Let's start by creating a simple dummy piece of content. Our goal will to be able to access and change this content through an auto-generated GraphQL API and Tina forms.

**/\_posts/welcome.md**

```md
---
title: This is my post
---
```

### Configuration

Before we can define the schema of our content, we need set up some configuration. Create a `.forestry` directory and then create the following two files.

**.forestry/config.js**

```js
// config.js
module.exports = {
  serverURL: "http://localhost:4001/api/graphql",
};
```

**.forestry/settings.yml**

```yml
---
new_page_extension: md
auto_deploy: false
admin_path:
webhook_url:
sections:
  - type: directory
    path: _posts # replace this with the relative path to your content section
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

These files will store a reference to the GraphQL endpoint we'll end up using, and will also let us know where we can find our content schemas.

### Define Content Schema

Now we define the shape of our content. This allows us to build a GraphQL API that will match the content, automatically generate the Tina forms that can interact with it, and optionally let us create TypeScript types.

**.forestry/front_matter/templates/post.yml**

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

#### Creating the GraphQL server

Now that we've defined our schema, let's use the CLI to setup a GraphQL server for our site to use.

<<<<<<< HEAD
From the cli in your site root, run:
=======
**Start your local GraphQL server by running:**

> > > > > > > master

```bash
npx tina-gql server:start
```

or

```bash
yarn tina-gql server:start
```

You can now go to [http://localhost:4001/api/graphql](http://localhost:4001/api/graphql) and use [GraphiQL](https://github.com/graphql/graphiql/blob/main/packages/graphiql/README.md) to explore your new GraphQL API.

**(Optional) Generate TypeScript types**

We can automatically generate TypeScript types based on your schema by running the following command:

<<<<<<< HEAD
Now let's start our server, run:

=======

> > > > > > > master

```bash
npx tina-gql schema:gen-query --typescript
```

or

```bash
yarn tina-gql schema:gen-query --typescript
```

This will create a file at `.forestry/types.ts`.

### Using the data within our Next.JS site

Now that we have a working GraphQL server with our local content, let's use it within our site.

_Make sure you keep your GraphQL server running in a seperate console through this entire process._

First, install the TinaCMS dependencies:

```bash
npm install tinacms styled-components
```

or

```bash
yarn add tinacms styled-components
```

<<<<<<< HEAD
In your site root, add TinaCMS & register the ForestryClient like so:
=======
In your site root, add TinaCMS & register the `ForestryClient` like so:

**\_app.tsx**

> > > > > > > master

```tsx
import React from "react";
import { withTina } from "tinacms";
import { ForestryClient } from "@forestryio/client";
import config from "../.forestry/config";

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default withTina(MyApp, {
  apis: {
    forestry: new ForestryClient({
      serverURL: config.serverURL,
    }),
  },
  sidebar: true,
});
```

If your site uses SSR, you may also need to add this to your **\_document.js** to handle TinaCMS's Styled Components

**pages/\_document.js**

```js
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

By registering the `ForestryClient` globally, we can now use it within our pages to fetch content.

**pages/posts/welcome.tsx**

```tsx
import config from "../../.forestry/config";
import query from "../../.forestry/query";
import { usePlugin } from "tinacms";
import { useForestryForm, ForestryClient } from "@forestryio/client";

export async function getStaticProps({ params }) {
  const path = `_posts/welcome.md`;
  const client = new ForestryClient({ serverURL: config.serverURL });
  const data = await client.getContent({
    path,
  });

  return { props: { path, data } };
}

export default function Home(props) {
  const [formData, form] = useForestryForm(props.data, {});
  usePlugin(form);

  return (
    <div>
      <h1>{formData.data.title}</h1>
    </div>
  );
}
```

Now, if you navigate to [/posts/welcome](http://localhost:3000/posts/welcome) you should see your content. You should also be able to update your content using the TinaCMS sidebar.

Next steps:

- Make changes to our data-model, and verify our templates with `$ tina-gql schema:audit`
- Setup build server to run in production
- Configure your site to use the `Tina Teams` API in your hosted Cloud Editing Environment
