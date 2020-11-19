import { DocumentUnion } from "../.tina/types";
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
          ... on Post {
            data {
              title
              image
              excerpt
              hashtags
              author {
                relativePath
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
  return {
    ...content,
    query: print(query),
    relativePath,
    section,
  };
};
