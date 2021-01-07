import { useForestryForm } from "@forestryio/client";
import { createClient } from "../utils/createClient";
import type * as Tina from "../.tina/types";
import { Sidebar } from "../components/sidebar";

const client = createClient(false);

export const getServerSideProps = async ({ params, ...rest }): Promise<any> => {
  const content = await client.requestWithForm(
    (gql) => gql`
      query ContentQuery($relativePath: String!) {
        getPagesDocument(relativePath: $relativePath) {
          data {
            ... on BlockPage_Doc_Data {
              title
            }
          }
        }
      }
    `,
    {
      variables: {
        relativePath: "home.md",
      },
    }
  );
  return { props: content };
};

const Home = (props: any) => {
  const { getPagesDocument } = useForestryForm<{
    getPagesDocument: Tina.Pages_Document;
  }>({ payload: props });
  const { form, sys, ...rest } = getPagesDocument;

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar relativePath="" />
      <pre>
        <code>{JSON.stringify(rest, null, 2)}</code>
      </pre>
    </div>
  );
};

export default Home;
