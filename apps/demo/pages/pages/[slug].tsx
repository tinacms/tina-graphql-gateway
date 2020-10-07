import { GetStaticProps, GetStaticPaths } from "next";
import { usePlugin } from "tinacms";
import { useForestryForm } from "@forestryio/client";
import { DocumentUnion, DocumentInput, Query } from "../../.forestry/types";
import { ContentCreatorPlugin } from "../../utils/contentCreatorPlugin";
import { getContent, getSlugs } from "../../utils/getStatics";

const template = "pages";

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
  if (!props.response) {
    return <div />;
  }
  const [formData, form] = useForestryForm<Query, DocumentUnion>(
    props.response
  );
  usePlugin(form);

  const createPagePlugin = new ContentCreatorPlugin<
    DocumentInput & { title: string }
  >({
    label: "Add Page",
    fields: [
      { name: "title", label: "Title", component: "text", required: true },
    ],
    filename: ({ title }) => {
      return `content/${template}/${title
        .replace(/\s+/, "-")
        .toLowerCase()}.md`;
    },
    body: () => ``,
    frontmatter: ({ title }) => {
      //remove any other dirs from the title, return only filename
      const id = `/${template}/${title.replace(/\s+/, "-").toLowerCase()}`;
      return {
        title,
        id,
        prev: null,
        next: null,
      };
    },
  });

  usePlugin(createPagePlugin);

  return (
    <pre>
      <code>{JSON.stringify(formData, null, 2)}</code>
    </pre>
  );
};

export default Home;
