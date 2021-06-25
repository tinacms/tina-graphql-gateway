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

export const nextPostPage = `
import { LocalClient, EditProvider } from "tina-graphql-gateway";
import type { Posts_Document } from "../../../.tina/__generated__/types";
import TinaWrapper from "../../../.tina/tina-wrapper";

export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : any;

// Use the props returned by get static props
export default function BlogPostPageWrapper(
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
const BlogPage = (props: AsyncReturnType<typeof getStaticProps>["props"]) => {
  return (
    <div
      style={{
        textAlign: "center",
      }}
    >
      <h1>{props.data.getPostsDocument.data.title}</h1>
      <div>{props.data.getPostsDocument.data._body}</div>
      <div
        style={{
          margin: "5rem",
          padding: ".5rem",
          backgroundColor: "rgba(180,244,224,0.3)",
        }}
      >
        <p>
          Hello! and thanks for bootstrapping a Tina App! Before you do anything
          click on the pencil icon in the bottom left hand corner. You can now
          edit this content in real time! Click save and notice that you have
          update the Hello world blog post in the local file system.
        </p>
        <p>
          To see how to hook up edit state,{" "}
          <a href="https://github.com/tinacms/tina-cloud-starter">
            checkout our starter app
          </a>
        </p>
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
        ... on Article_Doc_Data {
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

};
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
