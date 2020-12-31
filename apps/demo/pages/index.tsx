import { GetStaticProps } from "next";
import Link from "next/link";
import { createClient } from "../utils/createClient";

const client = createClient(false);

export const getStaticProps: GetStaticProps = async () => {
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

  return {
    props: {
      sections: result.getSections
        .map((section) => {
          return {
            section: section.slug,
            paths: section.documents
              .map((d) =>
                [...section.path.split("/"), ...d.sys.breadcrumbs].join("/")
              )
              .filter(Boolean),
          };
        })
        .filter(Boolean),
    },
  };
};

const Main = (props) => {
  return (
    <div>
      {props.sections.map((section) =>
        section.paths.map((path) => {
          return (
            <div key={path}>
              <Link href={`/${path}`}>
                <a>{path}</a>
              </Link>
            </div>
          );
        })
      )}
    </div>
  );
};

export default Main;
