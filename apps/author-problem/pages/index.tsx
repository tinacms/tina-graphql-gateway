import gql from "graphql-tag";
import { createClient } from "../utils/createClient";
import { useForestryForm2 } from "@forestryio/client";
import type * as Tina from "../.tina/types";
import { Card } from "../components/card";
import Head from "next/head";

const client = createClient(false);

const variables = {
  section: "posts",
  relativePath: "welcome.md",
};

export async function getServerSideProps() {
  return {
    props: await getContent(variables),
  };
}

const Main = (props) => {
  const { data } = useForestryForm2<Tina.Post_Data>({
    props,
    variables,
    fetcher: async () => await getContent(variables),
  });
  return (
    <>
      <Head>
        <link
          href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css"
          rel="stylesheet"
        />
      </Head>
      <div className="h-screen flex items-center justify-center">
        <div className="max-w-md">
          <Card
            title={data.title}
            image={data.image}
            hashtags={data.hashtags}
            excerpt={data.excerpt}
            author={data.author.node.data}
          />
        </div>
      </div>
    </>
  );
};

export default Main;

const getContent = async ({
  section,
  relativePath,
}: {
  section: string;
  relativePath: string;
}) => {
  return client.requestWithForm({
    query: gql`
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
    `,
    variables: {
      relativePath,
      section,
    },
  });
};
