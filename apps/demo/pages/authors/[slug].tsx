import { GetStaticProps, GetStaticPaths } from "next";
import { usePlugin } from "tinacms";
import { useForestryForm } from "@forestryio/client";
import { getStaticPropsUtil, getStaticPathsUtil } from "../../utils/getStatics";

const template = "authors";

export const getStaticPaths: GetStaticPaths = async () => {
  return getStaticPathsUtil({ template });
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  return getStaticPropsUtil({ template, params });
};

const Home = (props) => {
  const [formData, form] = useForestryForm(props.response);
  usePlugin(form);

  return (
    <pre>
      <code>{JSON.stringify(formData, null, 2)}</code>
    </pre>
  );
};

export default Home;
