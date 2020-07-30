import { GetStaticProps } from "next";
import Link from "next/link";
import { getStaticPropsIndex } from "../../utils/getStatics";

const template = "posts";

export const getStaticProps: GetStaticProps = async () => {
  return getStaticPropsIndex({ template });
};

const Main = (props) => {
  return (
    <div>
      <h1>{template}</h1>
      {props.paths.map((path) => (
        <div>
          <Link href={`/${template}/${path}`}>
            <a>{path}</a>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default Main;
