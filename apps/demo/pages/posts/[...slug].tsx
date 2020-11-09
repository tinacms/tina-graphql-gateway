import React from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import { useForestryForm } from "@forestryio/client";
import { getContent, getSlugs } from "../../utils/getStatics";

const template = "posts";

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await getSlugs({ template });
  return {
    paths: slugs.map((slug) => {
      return { params: { slug } };
    }),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async (props) => {
  const response = await getContent({
    template,
    params: props.params,
  });
  return { props: response };
};

const Home = (props) => {
  const data = useForestryForm(props);

  return (
    <>
      <pre>
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </>
  );
};

export default Home;
