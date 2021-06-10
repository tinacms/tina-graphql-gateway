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
import { TinaCMS } from "tinacms";
import { TinaCloudAuthWall, Client, LocalClient } from "tina-graphql-gateway";
import { useGraphqlForms } from "tina-graphql-gateway";
import { useMemo } from "react";
import type { Posts_Document } from '../../../.tina/__generated__/types'

// This create the client based on NEXT_PUBLIC_USE_LOCAL_CLIENT.
export const createClient = () => {
  return process.env.NEXT_PUBLIC_USE_LOCAL_CLIENT === "0"
    ? createCloudClient()
    : createLocalClient();
};

// This creates the cloud client and checks to make sure the correct environment variables are in place
export const createCloudClient = () => {
  const organization = process.env.NEXT_PUBLIC_ORGANIZATION_NAME;
  const clientId = process.env.NEXT_PUBLIC_TINA_CLIENT_ID;

  const missingEnv: string[] = [];
  if (!organization) {
    missingEnv.push("NEXT_PUBLIC_ORGANIZATION_NAME");
  }
  if (!clientId) {
    missingEnv.push("NEXT_PUBLIC_TINA_CLIENT_ID");
  }

  if (missingEnv.length) {
    throw new Error(\`The following environment variables are required when using the Tina Cloud Client:
     \${missingEnv.join(', ')}\`);
  }

  return new Client({
    organizationId: organization,
    clientId,
    branch: "main",
    tokenStorage: "LOCAL_STORAGE",
  });
};

/**
 * This is a GraphQL client that only talks to your local filesystem server,
 * as a result it's a great tool for static page building or local development.
 *
 * In this starter app you'll see it being used as both, with the
 * option to "switch on" the non-local client via environment variables.
 */
export const createLocalClient = () => {
  return new LocalClient();
};


export type AsyncReturnType<
  T extends (...args: any) => Promise<any>
> = T extends (...args: any) => Promise<infer R> ? R : any;

// Use the props returned by get static props
export default function BlogPostPage(
  props: AsyncReturnType<typeof getStaticProps>["props"]
) {
  return (
    <TinaWrapper {...props}>
      {(props) => {
        return (
          <>
            <h1>{props.data.getPostsDocument.data.title}</h1>
            <div>{props.data.getPostsDocument.data._body}</div>
          </>
        );
      }}
    </TinaWrapper>
  );
}

export const query = \`#graphql
  query BlogPostQuery($relativePath: String!) {
    getPostsDocument(relativePath: $relativePath) {
      data {
        __typename
        ... on Article_Doc_Data {
          title
          author {
            data {
              ... on Author_Doc_Data {
                name
                avatar
              }
            }
          }
          _body
        }
      }
    }
  }
\`;

const client = createLocalClient();

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

/**
 * This should be moved to _app.js and only wrap the app when you are in edit mode
 */
const TinaWrapper = (props) => {
  const cms = useMemo(() => {
    return new TinaCMS({
      apis: {
        tina: createClient(),
      },
      enabled: true,
      sidebar: true,
    });
  }, []);

  /** Disables the TinaCMS "Media Manager" */
  cms.plugins.all("screen").forEach((plugin) => {
    if (plugin.name === "Media Manager") {
      cms.plugins.remove(plugin);
    }
  });

  return (
    <TinaCloudAuthWall cms={cms}>
      <Inner {...props} />
    </TinaCloudAuthWall>
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

`
