import { GetStaticProps, GetStaticPaths } from "next";
import { usePlugin } from "tinacms";
import { DocumentUnion, Query } from "../../.forestry/types";
import { useForestryForm } from "@forestryio/client";
import { getContent, getSlugs } from "../../utils/getStatics";

const template = "authors";

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await getSlugs({ template });
  return {
    paths: slugs.map((slug) => {
      return { params: { slug: slug } };
    }),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  return { props: await getContent({ template, params }) };
};

const Home = (props) => {
  const [formData, form] = useForestryForm<Query, DocumentUnion>(
    props.response
  );
  usePlugin(form);

  return (
    <>
      <pre>
        <code>{JSON.stringify(formData, null, 2)}</code>
      </pre>
    </>
  );
};

export default Home;
