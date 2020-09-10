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
  console.log(props.response);
  const [res, setRes] = React.useState(props.response);
  const [formData, form] = useForestryForm<Query, DocumentUnion>(res);

  React.useEffect(() => {
    setTimeout(() => {
      let meh = res;
      meh.document.data.title = "Love it";
      console.log(meh);
      setRes(meh);
    }, 3000);
  });
  usePlugin(form);

  return (
    <pre>
      <code>{JSON.stringify(formData, null, 2)}</code>
    </pre>
  );
};

export default Home;
