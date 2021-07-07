/**
Copyright 2021 Forestry.io Holdings, Inc.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

export const blogPost = `---
title: Vote For Pedro
_template: article
---

This is your first post!
`

export const nextPostPage = ({ wrapper = false }: { wrapper: boolean }) => `
import { LocalClient, EditProvider } from "tina-graphql-gateway";
import type { Posts_Document } from "../../../.tina/__generated__/types";
import TinaWrapper from "../../../components/tina-wrapper";

export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : any;

// Use the props returned by get static props (this can be deleted when the edit provider and tina-wrapper are moved to _app.js)
${
  wrapper
    ? `export default function BlogPostPageWrapper(
  props: AsyncReturnType<typeof getStaticProps>["props"]
) {
  return (
    // TODO: Move edit provider and Tina provider to _app.js
    // your whole app should be wrapped in the lightweight edit provider
    <EditProvider>
      {/* When in edit mode your site should be wrapped in this Tina Wrapper */}
      <TinaWrapper {...props}>
        {(props) => {
          return <BlogPage {...props} />;
        }}
      </TinaWrapper>
    </EditProvider>
  );
}

// This will become the default export
`
    : ''
}
const BlogPage = (props: AsyncReturnType<typeof getStaticProps>["props"]) => {
  return (
    <div>
      <div
        style={{
          textAlign: "center",
        }}
      >
        <h1>{props.data.getPostsDocument.data.title}</h1>
        <div>{props.data.getPostsDocument.data._body}</div>
      </div>
      <div
        style={{
          margin: "5rem",
          padding: ".5rem",
          backgroundColor: "rgba(180,244,224,0.3)",
        }}
      >
        <p>
        Hello! and thanks for bootstrapping a Tina App! Before you do anything
        click on "toggle edit state" button and a pencil icon in the bottom left hand corner will appear. You can now
        edit this content in real time! Click save and notice that you have
        update the Hello world blog post in the local file system.
        </p>
        <h2>Next steeps</h2>
        <h3>Wrap your App in "Edit State" (CLI probably have done this for you)</h3>
        <p>
          To do this add the following to your pages/_app.js. (or create this
          file if it is not present in your project)
        </p>
        <div>
          <strong>_app.js</strong>
        </div>
        <pre>
          <code>
            {\`
import dynamic from "next/dynamic";

import { EditProvider, setEditing, useEditState } from "tina-graphql-gateway";

// InnerApp that handles rendering edit mode or not
function InnerApp({ Component, pageProps }) {
  const { edit } = useEditState();
  if (edit) {
    // Dynamically load Tina only when in edit mode so it does not affect production
    // see https://nextjs.org/docs/advanced-features/dynamic-import#basic-usage
    const TinaWrapper = dynamic(() => import("../components/tina-wrapper"));
    return (
      <>
        <TinaWrapper {...pageProps}>
          {(props) => <Component {...props} />}
        </TinaWrapper>
      </>
    );
  }
  return <Component {...pageProps} />;
}

// Our app is wrapped with edit provider
function App(props) {
  return (
    <EditProvider>
      <ToggleButton />
      <InnerApp {...props} />
    </EditProvider>
  );
}
const ToggleButton = () => {
  const { edit, setEdit } = useEditState();
  return (
    <button
      onClick={() => {
        setEdit(!edit);
      }}
    >
      Toggle Edit State
    </button>
  );
};

export default App;
\`}
          </code>
        </pre>
        <p>
          Please restart your dev server (CTR + C and yarn dev) and now you will have access to the <code>useEditState</code> hook
          anywhere in your app. You will also notice that we are lazy loading
          the tina-wrapper component. This is so that no Tina code will load in
          your production bundle.
        </p>
        <p>
          Next you can delete the editProvider and TinaWrapper from
          'pages/demo/blog/[filename].ts' by deleting the default export and
          adding
        </p>
        <code>
          <pre>export default BlogPage;</pre>
        </code>
        <h3>Make a page editable</h3>
        <p>To make a page editable we need to do three things</p>
        <ol>
          <li>Update our schema.ts</li>
          <li>Update our query</li>
          <li>Update our code</li>
        </ol>
        <h4>Update schema.ts</h4>
        lets update our schema.ts to include product listings. We will do so by
        added an "pages collection" with a product listing template. When added
        to our existing blog collection it looks like this. We also need a place
        to store the authors in the file system. So lets create a folder
        "content/pages".
        <pre>
          <code>
            {\`
import { defineSchema } from "tina-graphql-gateway-cli";

export default defineSchema({
  collections: [
    {
      label: "Pages",
      name: "pages",
      path: "content/pages",
      templates: [
        {
          label: "Product listing page",
          name: "product",
          fields: [
            {
              type: "group-list",
              label: "Products",
              name: "products",
              fields: [
                {
                  type: "text",
                  label: "Item ID",
                  name: "id",
                },
                {
                  type: "textarea",
                  label: "Description",
                  name: "description",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      label: "Blog Posts",
      name: "posts",
      path: "content/posts",
      templates: [
        {
          label: "Article",
          name: "article",
          fields: [
            {
              type: "text",
              label: "Title",
              name: "title",
            },
          ],
        },
      ],
    },
  ],
});
            \`}
          </code>
        </pre>
        <p>
          Lets also create a file to query. In the folder we just created
          (content/pages) add a file called "product-listing.md"
        </p>
        <pre>
          <code>
            {\`
---
_template: product
---
\`}
          </code>
        </pre>
        <h4>Make a new Next.js page and a graphql Query</h4>
        Start by making a new file called pages/product-listing.tsx that
        contains the following
        <pre>
          <code>
            {\`
import { LocalClient } from "tina-graphql-gateway";
import { Pages_Document } from "../.tina/__generated__/types";
import { AsyncReturnType } from "./demo/blog/[filename]";

const ProductListingPage = (
  props: AsyncReturnType<typeof getStaticProps>["props"]
) => {
  console.log(props);
  return (
    <div>
      <ol>
        {props.data.getPagesDocument?.data?.products?.map((product) => (
          <li key={product.id}>
            id: {product.id}, description: {product.description}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default ProductListingPage;

const query = \\\`#graphql
query ProuctPageQuery {
  getPagesDocument(relativePath: "content/pages/product-listing.md"){
    data {
      __typename ... on  Product_Doc_Data{
        products {
          id
          description
        }
      }
    }
  }
}

\\\`;
const client = new LocalClient();

export const getStaticProps = async () => {
  return {
    props: {
      data: await client.request<{ getPagesDocument: Pages_Document }>(query, {
        variables: {},
      }),
      variables: {},
      query,
    },
  };
};
\`}
          </code>
        </pre>
        <p>
          We are doing a couple of things here. A graphql query was written that
          looks for the content/pages/product-listing.md file
        </p>
        <p>
          The query is being statically exported so it can be accessed by the
          TinaWrapper.
        </p>
        <p>The code was updated to display the list of products.</p>
        <p>
          Visit
          <a href="http://localhost:3000/product-listing" target="blank">
            http://localhost:3000/product-listing{" "}
          </a>{" "}
          to see what you just created. Click the "edit this site" button in the
          top to edit.
        </p>
        <h4>Tina Cloud</h4>
        <p>
          To hook up this demo to Tina Cloud and save content to Github instead
          of the file system you can do the following.
        </p>
        <ol
          style={{
            margin: "0px auto",
          }}
        >
          <li>Register at https://auth.tina.io</li>
          <li>
            Update .env file to include:
            <pre>
              <code>
                <div>
                  NEXT_PUBLIC_ORGANIZATION_NAME= get this from the organization
                  you create at auth.tina.io
                </div>
                <div>
                  NEXT_PUBLIC_TINA_CLIENT_ID= get this from the app you create
                  at auth.tina.io
                </div>
                <div>NEXT_PUBLIC_USE_LOCAL_CLIENT=0</div>
              </code>
            </pre>
          </li>
        </ol>
      </div>
    </div>
  );
};

export const query = \`#graphql
  query BlogPostQuery($relativePath: String!) {
    getPostsDocument(relativePath: $relativePath) {
      data {
        __typename
        ... on  Article_Doc_Data{
          title
          _body
        }
      }
    }
  }
\`;

const client = new LocalClient();

export const getStaticProps = async ({ params }) => {
  const variables = { relativePath: \`\${params.filename}.md\` };
  return {
    props: {
      data: await client.request<{ getPostsDocument: Posts_Document }>(query, {
        variables,
      }),
      variables,
      query,
    },
  };
};

/**
 * To build the blog post pages we just iterate through the list of
 * posts and provide their "filename" as part of the URL path
 *
 * So a blog post at "content/posts/hello.md" would
 * be viewable at http://localhost:3000/posts/hello
 */
export const getStaticPaths = async () => {
  const postsListData = await client.request<{
    getPostsList: Posts_Document[];
  }>(
    (gql) => gql\`
      {
        getPostsList {
          sys {
            filename
          }
        }
      }
    \`,
    { variables: {} }
  );
  return {
    paths: postsListData.getPostsList.map((post) => ({
      params: { filename: post.sys.filename },
    })),
    fallback: false,
  };
};
${wrapper ? '' : 'export default BlogPage'}
`

export const TinaWrapper = `
import { TinaCloudProvider, useGraphqlForms } from "tina-graphql-gateway";

const TinaWrapper = (props) => {
  return (
    <TinaCloudProvider
      clientId={process.env.NEXT_PUBLIC_TINA_CLIENT_ID}
      branch={process.env.NEXT_PUBLIC_EDIT_BRACH}
      organization={process.env.NEXT_PUBLIC_ORGANIZATION_NAME}
      isLocalClient={Boolean(
        Number(process.env.NEXT_PUBLIC_USE_LOCAL_CLIENT ?? true)
      )}
    >
      <Inner {...props} />
    </TinaCloudProvider>
  );
};

const Inner = (props) => {
  const [payload, isLoading] = useGraphqlForms({
    query: (gql) => gql(props.query),
    variables: props.variables || {},
  });
  return (
    <>
      {isLoading ? (
        <>
          <div>Loading</div>
          <div
            style={{
              pointerEvents: "none",
            }}
          >
            {props.children(props)}
          </div>
        </>
      ) : (
        // pass the new edit state data to the child
        props.children({ ...props, data: payload })
      )}
    </>
  );
};

export default TinaWrapper;

`

export const AppJsContent = `
import dynamic from "next/dynamic";

import { EditProvider, setEditing, useEditState } from "tina-graphql-gateway";

// InnerApp that handles rendering edit mode or not
function InnerApp({ Component, pageProps }) {
  const { edit } = useEditState();
  if (edit) {
    // Dynamically load Tina only when in edit mode so it does not affect production
    // see https://nextjs.org/docs/advanced-features/dynamic-import#basic-usage
    const TinaWrapper = dynamic(() => import("../components/tina-wrapper"));
    return (
      <>
        <TinaWrapper {...pageProps}>
          {(props) => <Component {...props} />}
        </TinaWrapper>
      </>
    );
  }
  return <Component {...pageProps} />;
}

// Our app is wrapped with edit provider
function App(props) {
  return (
    <EditProvider>
      <ToggleButton />
      <InnerApp {...props} />
    </EditProvider>
  );
}
const ToggleButton = () => {
  const { edit, setEdit } = useEditState();
  return (
    <button
      onClick={() => {
        setEdit(!edit);
      }}
    >
      Toggle Edit State
    </button>
  );
};

export default App;`
