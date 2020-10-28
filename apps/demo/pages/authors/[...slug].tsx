import { GetStaticProps, GetStaticPaths } from "next";
import { useForestryForm2 } from "../../.forestry/types";
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

const Page = (props) => {
  const data = useForestryForm2(props);

  return (
    <>
      <pre>
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </>
  );
};

export default Page;
