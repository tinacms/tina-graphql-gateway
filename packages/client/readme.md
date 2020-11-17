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

Before we can define the schema of our content, we need set up some configuration. Create a `.forestry` directory and then create the following files.

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

### Sourcing your content

Now that we have defined our content model, we can connect our site to the Tina.io content API

_Make sure your .tina directory is pushed to git_

#### Creating a Tina.io app

The Tina.io content API connects to your Github repository, and puts the content behind Tina.io's expressive content API.

- Navigate to [Tina.io](https://auth.tinajs.dev/)
- Create a realm
- Create an app

You will then see a client-id for your new app. We will use this shortly.

#### Using the data within our Next.JS site

First, install the TinaCMS dependencies:

```bash
npm install tinacms styled-components http-proxy-middleware
```

or

```bash
yarn add tinacms styled-components http-proxy-middleware
```

In your site root, add TinaCMS & register the `ForestryClient` like so:

**\_app.tsx**

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
      realm: "your-realm-name", // this was set by you in the previous step
      clientId: "your-client-id", // this is visible in your Tina.io dashboard
      redirectURI: "your webpage url", //e.g http://localhost:3000
    }),
  },
  sidebar: true,
});
```

We'll also want to wrap our main layout in the `TinacmsForestryProvider` to support authentication

```tsx

//...

function MyApp({ Component, pageProps }) {
  return (<TinacmsForestryProvider
    onLogin={() => {
      const headers = new Headers()

      //TODO - the token should could as a param from onLogin
      headers.append('Authorization', 'Bearer ' + Cookies.get("tinacms-auth"))
      fetch('/api/preview', {
        method: 'POST',
        headers: headers,
      }).then(() => {
        window.location.href = '/'
      })

    }}
    onLogout={() => {console.log('exit edit mode')}}
  ><Component {...pageProps} />)
}

//...

```

This Next implementation relies on a few backend functions.

```tsx
// /pages/api/preview.ts
const preview = (req: any, res: any) => {
  const token = (req.headers["authorization"] || "").split(" ")[1] || null;

  const previewData = {
    tinaio_token: token,
  };
  res.setPreviewData(previewData);
  res.end("Preview mode enabled");
};

export default preview;
```

```tsx
// /pages/api/proxy/[...slug].ts
import { createProxyMiddleware } from "http-proxy-middleware";

//proxy to circumvent cors on identity app
const apiProxy = createProxyMiddleware({
  target: "https://identity.tinajs.dev",
  changeOrigin: true,
  pathRewrite: { [`^/api/proxy`]: "" },
  secure: false,
});

export default apiProxy;
```

The last step is to add a way for the user to enter edit-mode. Let's create a `/login` page.

```tsx
// /pages/login.tsx
import { EditLink } from "../components/EditLink";
import { useCMS } from "tinacms";

const EditLink = () => {
  const cms = useCMS();

  return (
    <button onClick={() => cms.toggle()}>
      {cms.enabled ? "Exit Edit Mode" : "Edit This Site"}
    </button>
  );
};

export default function Login(props) {
  return (
    <>
      <EditLink />
      {props.preview && (
        <p>
          You are logged in to Tina.io. Return to <a href="/">homepage</a>
        </p>
      )}
    </>
  );
}

export const getStaticProps = async (props: {
  preview: boolean;
  previewData: { tinaio_token: string };
}) => {
  return {
    props: {
      preview: !!props.preview,
    },
  };
};
```

Your users should at this point be able to login and view their content from Tina.io's API. We will also want the site to build outside of edit-mode, for your production content.

#### Creating a local GraphQL server

Now that we've defined our schema, let's use the CLI to setup a GraphQL server for our site to use locally, or during production builds.

**Start your local GraphQL server by running:**

```bash
npx tina-gql server:start
```

or

```bash
yarn tina-gql server:start
```

You can now go to [http://localhost:4001/api/graphql](http://localhost:4001/api/graphql) and use [GraphiQL](https://github.com/graphql/graphiql/blob/main/packages/graphiql/README.md) to explore your new GraphQL API.

**pages/posts/welcome.tsx**

```tsx
import config from "../../.forestry/config";
import query from "../../.forestry/query";
import { usePlugin } from "tinacms";
import {
  useForestryForm,
  ForestryClient,
  DEFAULT_LOCAL_TINA_GQL_SERVER_URL,
} from "@forestryio/client";

// These are your generated types from CLI
import { DocumentUnion, Query } from "../../.tina/types";

export async function getStaticProps({ params }) {
  const path = `_posts/welcome.md`;
  const client = new ForestryClient({
    realm: "your-realm-name", // this was set by you in the previous step
    clientId: "your-client-id", // this is visible in your Tina.io dashboard
    redirectURI: "your webpage url", //e.g http://localhost:3000
    customAPI: preview ? undefined : DEFAULT_LOCAL_TINA_GQL_SERVER_URL,
  });
  const response = await client.getContent({
    path,
  });

  return { props: { path, data } };
}

export default function Home(props) {
  const [formData, form] = useForestryForm<Query, DocumentUnion>(props.data);
  usePlugin(form);

  return (
    <div>
      <h1>{formData.data.title}</h1>
    </div>
  );
}
```

Now, if you navigate to [/posts/welcome](http://localhost:3000/posts/welcome) you should see your production content. Once you log-in, you should also be able to update your content using the TinaCMS sidebar.

Next steps:

- Make changes to our data-model, and verify our templates with `$ tina-gql schema:audit`
- Setup typescript types for your data-model

**(Optional) Generate TypeScript types**

We can automatically generate TypeScript types based on your schema by running the following command:

```bash
npx tina-gql schema:gen-query --typescript
```

or

```bash
yarn tina-gql schema:gen-query --typescript
```

This will create a file at `.forestry/types.ts`.
