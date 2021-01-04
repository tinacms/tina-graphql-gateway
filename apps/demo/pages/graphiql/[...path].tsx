import { GetStaticPropsResult } from "next";
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
  const router = useRouter();
  const { path } = router.query;

  if (typeof path === "string") {
    throw new Error(
      "Path should be an array of strings, ensure your filename is [...path].tsx"
    );
  }

  return <Explorer section={path[0]} relativePath={path.slice(1).join("/")} />;
};

export default Home;
