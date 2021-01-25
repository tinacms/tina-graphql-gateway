/**
Copyright 2021 Forestry.io Inc
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

import { useForm } from "tina-graphql-gateway";
import { createClient } from "../utils/createClient";
import type * as Tina from "../.tina/types";
import { Sidebar } from "../components/sidebar";

const client = createClient(false);

export const getServerSideProps = async ({ params, ...rest }): Promise<any> => {
  if (typeof params.path === "string") {
    throw new Error("Expected an array of strings for path slugs");
  }

  const content = await client.requestWithForm(
    (gql) => gql`
      query ContentQuery($section: String!, $relativePath: String!) {
        getDocument(section: $section, relativePath: $relativePath) {
          ... on Menus_Document {
            data {
              ... on Menu_Doc_Data {
                logo
              }
            }
          }
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
        section: params.path[0],
        relativePath: params.path.slice(1).join("/"),
      },
    }
  );
  return { props: content };
};

const Home = (props: any) => {
  const { getDocument } = useForm<{
    getDocument: Tina.SectionDocumentUnion;
  }>({ payload: props });
  const { form, sys, ...rest } = getDocument;

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
