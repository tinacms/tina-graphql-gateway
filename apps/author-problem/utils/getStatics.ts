import { createClient } from "./createClient";
import gql from "graphql-tag";
import { print } from "graphql";

const client = createClient(false);

export const getSlugs = async ({ template }) => {
  const documents = await client.listDocumentsBySection({ section: template });
  return documents.map(({ breadcrumbs }) => breadcrumbs);
};

export const getContent = async ({ template, params }) => {
  const relativePath = `${params.slug.join("/")}.md`;
  const section = template;
  const query = gql`
    query DocumentQuery($relativePath: String!, $section: String!) {
      document(relativePath: $relativePath, section: $section) {
        node {
          __typename
          ... on Author {
            data {
              name
              image
              anecdotes
            }
          }
          ... on Post {
            data {
              title
              image
              excerpt
              hashtags
              author {
                node {
                  ... on Author {
                    data {
                      name
                      image
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  const content = await client.requestWithForm<object>({
    query,
    variables: {
      relativePath,
      section,
    },
  });

  const postQuery = gql`
    query DocumentQuery($relativePath: String!, $section: String!) {
      document(relativePath: $relativePath, section: $section) {
        node {
          __typename
          ... on Author {
            data {
              name
              image
              anecdotes
            }
          }
          ... on Post {
            data {
              title
              image
              excerpt
              hashtags
              author {
                node {
                  ... on Author {
                    data {
                      name
                      image
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  const post = await client.requestWithForm<object>({
    query: postQuery,
    variables: {
      relativePath: "welcome.md",
      section,
    },
  });

  const authorQuery = gql`
    query DocumentQuery($relativePath: String!, $section: String!) {
      document(relativePath: $relativePath, section: $section) {
        node {
          __typename
          ... on Author {
            data {
              name
              image
              anecdotes
            }
          }
        }
      }
    }
  `;
  const author = await client.requestWithForm<object>({
    query: authorQuery,
    variables: {
      relativePath: "emily.md",
      section: "authors",
    },
  });

  return {
    ...content,
    query: print(query),
    tinaPost: post,
    tinaAuthor: author,
    relativePath,
    section,
  };
};
