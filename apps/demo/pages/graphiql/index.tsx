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

import { useRouter } from "next/router";
import { createClient } from "../../utils/createClient";
import { Explorer } from "../../components/graphiql";

const client = createClient(false);

export const getServerSideProps = async () => {
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
  return { props: result };
};

const Home = (props: any) => {
  return <Explorer section={props.getSections[0].slug} relativePath={""} />;
};

export default Home;
