import { GetStaticProps } from "next";
import Link from "next/link";
import { getSlugs } from "../../utils/getStatics";

const template = "posts";

export const getStaticProps: GetStaticProps = async () => {
  const slugs = await getSlugs({ template });

  return {
    props: {
      paths: slugs.map((slug) => {
        return { params: { slug: slug } };
      }),
    },
  };
};

const Main = (props) => {
  return (
    <div>
      <h1>{template}</h1>
      {props.paths.map((path) => {
        return (
          <div key={path.params.slug}>
            <Link href={`/${template}/${path.params.slug}`}>
              <a>{path.params.slug}</a>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default Main;
