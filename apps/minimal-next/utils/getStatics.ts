import { createClient } from "./createClient";
import gql from "graphql-tag";

const client = createClient(false);

export const getSlugs = async ({ template }) => {
  const documents = await client.listDocumentsBySection({ section: template });
  return documents.map(({ breadcrumbs }) => breadcrumbs);
};

export const getContent = async ({ template, params }) => {
  const relativePath = `${params.slug.join("/")}.md`;
  const section = template;
  const content = await client.requestWithForm({
    query: gql`
      query DocumentQuery($relativePath: String!, $section: String!) {
        document(relativePath: $relativePath, section: $section) {
          node {
            __typename
            ... on Post {
              data {
                title
                author {
                  section {
                    type
                    path
                    label
                    create
                    match
                    templates
                    slug
                  }
                  path
                  relativePath
                  breadcrumbs
                  basename
                  extension
                  filename
                  node {
                    ... on Author {
                      __typename
                    }
                  }
                }
                hashtags
              }
            }
          }
        }
      }
    `,
    variables: { relativePath, section },
  });
  return {
    ...content,
    relativePath,
    section,
  };
};
