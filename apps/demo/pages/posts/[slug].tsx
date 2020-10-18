import React from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import { usePlugin } from "tinacms";
import { useForestryForm } from "@forestryio/client";
import { DocumentUnion, Query } from "../../.forestry/types";
import { getContent, getSlugs } from "../../utils/getStatics";

const template = "posts";

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
    props.response.document
  );

  usePlugin(form);

  return (
    <>
      <h2>Form initial values</h2>
      <p>This is the data we pass to useForm as initial values</p>
      <pre>
        <code>{JSON.stringify(formData, null, 2)}</code>
      </pre>
    </>
  );
};

export default Home;
