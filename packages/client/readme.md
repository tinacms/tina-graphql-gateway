## Introduction

This package allows you to interact with an automatically generated GraphQL API using TinaCMS. Included are multiple GraphQL adapters that give you a consistent GraphQL API regardless of your datasource.

_For example, if your content is Git-backed, you might want to use your local content in development. While in your production Cloud Editing Environment, you can use our "Tina Teams" server to fetch your content. The API for both backends will be consistent, so you can easily switch between the two datasources without changing your site's code._

If you like to work in TypeScript, the [tina-graphql-gateway-cli](https://github.com/forestryio/graphql-demo/tree/master/packages/cli) package can generate types using the same schema definition that the GraphQL adapters will use.

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

- A `Client` class (which you can use as a TinaCMS API Plugin), that takes care of all interaction with the GraphQL server.
- A `useForm` hook, that you can use to hook into the Tina forms that let you edit your content.

```bash
npm install --save tina-graphql-gateway
```

or

```bash
yarn add tina-graphql-gateway
```

### CLI package

You'll also likely want to install our CLI to help with development:

```bash
npm install --save-dev tina-graphql-gateway-cli
```

or

```bash
yarn add --dev tina-graphql-gateway-cli
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

Before we can define the schema of our content, we need set up some configuration. Create a `.tina` directory and then create the following files.

**.tina/settings.yml**

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

These files will create a map our content to content models. In the above file, we declare any markdown files in our project should be a "post" type (we'll define this post type next).

### Define Content Schema

Templates define the shape of different content models.

**.tina/front_matter/templates/post.yml**

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

Now that we have defined our content model, we can connect our site to the Tina.io Content API

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
npm install tinacms styled-components
```

or

```bash
yarn add tinacms styled-components
```

In your site root, add TinaCMS & register the `Client` like so:

**\_app.tsx**

```tsx
import React from "react";
import { withTina } from "tinacms";
import { Client } from "tina-graphql-gateway";
import config from "../.forestry/config";

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default withTina(MyApp, {
  apis: {
    tina: new Client({
      realm: "your-realm-name", // this was set by you in the previous step
      clientId: "your-client-id", // this is visible in your Tina.io dashboard
      redirectURI: "your webpage url", //e.g http://localhost:3000
      // identityProxy: "", // we can use an identity proxy if we want to use a CSRF token (see token storage below)
      // customAPI: "", // might be used with the identityProxy, to proxy through a custom backend service.
      // tokenStorage: (Default Memory). Possible values: "MEMORY" | "LOCAL_STORAGE" | "CUSTOM".
      // NOTE: If you choose to use LOCAL_STORAGE, you may be prone to CSRF vulnerabilities.
      // getTokenFn: undefined, // This is only used when "tokenStorage" is set to "CUSTOM". Instead of grabbing the token from local storage, we can specify how its access token is retreived. You might want to use this if you are fetching content server-side.
    }),
  },
  sidebar: true,
});
```

We'll also want to wrap our main layout in the `TinaCloudProvider` to support authentication

```tsx

//...

function MyApp({ Component, pageProps }) {

  const client = useCMS().api.tina

  return (<TinaCloudProvider
    onLogin={(token: string) => {
      const headers = new Headers()

      //TODO - the token should could as a param from onLogin
      headers.append('Authorization', 'Bearer ' + token)
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

This Next implementation relies on a backend function to save its auth details.

```tsx
// /pages/api/preview.ts
import Cookies from "cookies";

const preview = (req: any, res: any) => {
  const token = (req.headers["authorization"] || "").split(" ")[1] || null;

  res.setPreviewData({});

  const cookies = new Cookies(req, res);
  cookies.set("tinaio_token", token, {
    httpOnly: true,
  });

  res.end("Preview mode enabled");
};

export default preview;
```

The last step is to add a way for the user to enter edit-mode. Let's create a `/login` page.

```tsx
// /pages/login.tsx
import { useCMS } from "tinacms";

export default function Login(props) {
  const cms = useCMS();

  return (
    <button onClick={() => cms.toggle()}>
      {cms.enabled ? "Exit Edit Mode" : "Edit This Site"}
    </button>
  );
}
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

**pages/posts/welcome.tsx**

```tsx
import config from "../../.tina/config";
import query from "../../.tina/query";
import Cookies from 'cookies'
import { usePlugin } from "tinacms";
import {
  useForm,
  Client,
  DEFAULT_LOCAL_TINA_GQL_SERVER_URL,
} from "tina-graphql-gateway";

// These are your generated types from CLI
import { DocumentUnion, Query } from "../../.tina/types";

export async function getServerProps({ params }) {
  const client = new Client({...});

  export const request = async (
  client: Client,
  variables: { section: string; relativePath: string }
) => {
  const content = await client.requestWithForm(
    (gql) => gql`
      query ContentQuery($section: String!, $relativePath: String!) {
        getDocument(section: $section, relativePath: $relativePath) {
          __typename
          ... on Authors_Document {
            data {
              ...on Author_Doc_Data {
                name
              }
            }
          }
        }
      }`,
      {
        variables: {
          relativePath: 'my-author.md',
          section: 'authors'
        }
      })

  return { props: content };
}

export default function Page(props: { getDocument: Tina.SectionDocumentUnion }) {
  return <MyComponent {...props.getDocument} />;
}
```

Now, if you navigate to [/posts/welcome](http://localhost:3000/posts/welcome) you should see your production content. Once you log-in, you should also be able to update your content using the TinaCMS sidebar.

Next steps:

- Make changes to our data-model, and verify our templates with `$ tina-gql schema:audit`
- Setup typescript types for your data-model

## Token storage

There are a few ways to store the authentication token:

### Local storage (Default)

Storing tokens in browser local storage persists the user session between refreshes & across browser tabs. One thing to note is; if an attacker is able to inject code in your site using a cross-site scripting (XSS) attack, your token would be vulernable.
To add extra security, a CSRF token can be implemented by using a proxy.

Within your client instantiation:

```ts
new Client({
  // ...
  identityProxy: "/api/auth/token",
});
```

From your site's server (This example uses NextJS's API functions)

```ts
// pages/api/auth/token

// ... Example coming soon
```

### In memory (Coming soon)

This is our recommended token storage mechanism if possible. Storing tokens in memory means that the user session will not be persisted between refreshes or across browser tabs. This approach does not require a server to handle auth, and is the least vulernable to attacks.

## Typescript

We can automatically generate TypeScript types based on your schema by running the following command with the Tina Cloud CLI:

```bash
yarn tina-gql schema:types
```

or

```bash
yarn tina-gql schema:gen-query --typescript
```

This will create a file at `.tina/types.ts`.

# The GraphQL Client

The goal of this package and the Content API is to allow the developer to write code in the same way they normally would while giving them the ability to edit content through Tina. To that end this package is responsible for 2 things: Data fetching to the GraphQL API and connecting that data to a Tina form.

## Data-fetching:

```ts
// requestWithForm takes the underlying query and adds to it Tina-specific fields
const payload = await client.requestWithForm(
  (gql) => gql`
    query ContentQuery($section: String!, $relativePath: String!) {
      getDocument(section: $section, relativePath: $relativePath) {
        __typename
        ... on Authors_Document {
          data {
            __typename
            ... on Author_Doc_Data {
              name
            }
          }
        }
      }
    }
  `,
  {
    variables,
  }
);
```

In our examples you'll often see this getting called from `getStaticProps` or `getServerSideProps`. Everything in the `payload` is serializable so there's no magic going on here. We just add some fields that we need for the `useForm` hook below. We also expose a `client.request` function, which won't add any Tina form fields.

> Note: it may be desirable to support other GraphQL clients in the future, there's not much stopping us from doing this, but for simplicity we're using `fetch` and not doing any caching or normalization on the client.

## Connecting to Tina forms

Passing this payload into the `useForm` hook will initialize a form for each node in the query:

```tsx
const result = useForm({
  // pass the payload from your request
  payload: payload,
  // When creating a new document, you'll want to redirect the user to it:
  onNewDocument: (args) => {
    const path = generatePath(args);
    window.location.assign(path);
  },
});
```

The `result` variable here will have the identical data that you passed in from the `payload` variable, but there's a side-effect in the hook which creates forms in Tina.

### Why don't we use the `useForm` hook from `tinacms`?

If you're familiar with TinaCMS you'll notice that this looks similar to the hook provided, with some slight differences:

With the TinaCMS hook:

- We pass an instance of the form as an argument
- The sidebar isn't automatically registered
- The values we get back are **form** values
- We also get back the form instance

With the `tina-gateway` hook:

- We didn't initialize a form anywhere
- The sidebar is automatically registered
- The values we get back are from the query
- We don't have access to the form

> NOTE: we don't have any reason not to provide access to the form, it's just not been necessary yet.

The primary reason for the altered API is that we initialize the form for you, with all of the fields being built automatically. We'll also create potentially several forms depending on how many nodes you've queried for.

There's also the fact that GraphQL APIs resolve content relationships, this capability leads to some friction when you're building the form yourself. If you expect to query across relationships:

```graphql
{
  getDocument(...) {
    ...on Post_Document {
      data {
        ...on Post_Doc_Data {
          title
          author {
            ...on Author_Document {
              data {
                ...on Author_Doc_Data {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
}
```

How would this look as forms in Tina? We'd need to know that `author` is actually referencing another node, and we'd need to split our response into multiple forms. The `post` form would need to treat the `author` field as a reference, while the `author` from would be where you can alter the author's data. And to make things more difficult, when the `post` form change's it's `author` value, you'll have to refetch the author data from the server and recreate that form.

We're referring to this as the author problem, it gets to the core of how we can give developers the expressive control of GraphQL without having to unwind it's benefits for usage in Tina.

### What about field customization?

Since Tina gives you full control over your field components, you'll inevitably want to make some changes to provided field types or bring your own components entirely. This isn't currently possible but we're exploring where we'd like to put this logic. In general the `useForm` hook from `tina-gateway` should be able to compose anything you, the as the developer, would like to provide while still orchestrating the form building automatically.

### What if I don't like GraphQL?

GraphQL is at the center of our solution, it's strict types are what allow us to generate a Tina form based on your `.tina` config, however using GraphQL for your website isn't for everyone - and we don't intend to make it mandatory. For now, the only way to work with the Content API is through GraphQL queries, but we hope to improve this package to the point that it's able to work without requiring the developer to write GraphQL if they don't want to.

An example of how this might look:

```ts
client.query.author("path-to-author.md");
// getting relational data
client.query.post("path-to-post.md").include("author");
// or making a mutation
client.mutation.post("path-to-post.md", {
  data: {
    some: "data",
  },
});
```

This type of work isn't a priority right now, and the example above would require us to **generate** a client for you, in much the same way as is done in [Prisma's client](https://www.prisma.io/docs/concepts/components/prisma-client).
