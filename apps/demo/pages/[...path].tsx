import { GetStaticPaths, GetStaticPropsResult } from "next";
import { useForestryForm } from "@forestryio/client";
import { createClient } from "../utils/createClient";
import type * as Tina from "../.tina/types";
const client = createClient(false);

const Home = (props: Props) => {
  const { node } = useForestryForm({ payload: props });
  const { form, sys, ...rest } = node;

  return (
    <>
      <pre>
        <code>{JSON.stringify(rest, null, 2)}</code>
      </pre>
    </>
  );
};

export default Home;

export const getStaticPaths: GetStaticPaths = async () => {
  const result = await client.request(
    (gql) => gql`
      query SectionsQuery {
        getSections {
          slug
          path
          documents {
            sys {
              breadcrumbs(excludeExtension: true)
            }
          }
        }
      }
    `,
    { variables: {} }
  );

  const paths = [];
  result.getSections.forEach((section) =>
    section.documents.forEach((document) => {
      paths.push({
        params: {
          path: [...section.path.split("/"), ...document.sys.breadcrumbs],
        },
      });
    })
  );

  return {
    paths,
    fallback: true,
  };
};

type Props = { node: Tina.Node };

export const getStaticProps = async ({
  params,
}): Promise<GetStaticPropsResult<Props>> => {
  if (typeof params.path === "string") {
    throw new Error("Expected an array of strings for path slugs");
  }
  const fullPath = `${params.path.join("/")}.md`;

  const content = await client.requestWithForm(
    (gql) => gql`
      query ContentQuery($fullPath: ID!) {
        node(id: $fullPath) {
          ... on Posts_Document {
            data {
              ... on Post_Doc_Data {
                title
                author {
                  data {
                    ... on Author_Doc_Data {
                      name
                    }
                  }
                }
              }
            }
          }
          ... on Authors_Document {
            data {
              ... on Author_Doc_Data {
                name
              }
            }
          }
          ... on Pages_Document {
            data {
              ... on BlockPage_Doc_Data {
                title
              }
            }
          }
        }
      }
    `,
    {
      variables: {
        fullPath,
      },
    }
  );
  return { props: content };
};
