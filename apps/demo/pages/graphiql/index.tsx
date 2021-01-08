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
