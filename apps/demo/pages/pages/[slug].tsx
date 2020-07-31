import { GetStaticProps, GetStaticPaths } from "next";
import { usePlugin } from "tinacms";
import { ForestryClient, useForestryForm } from "@forestryio/client";
import { DocumentUnion, DocumentInput } from "../../.forestry/types";
import { ContentCreatorPlugin } from "../../utils/contentCreatorPlugin";

const fg = require("fast-glob");

const template = "pages";

function fileToUrl(filepath: string) {
  filepath = filepath.split(`/${template}/`)[1];
  return filepath.replace(/ /g, "-").slice(0, -3).trim();
}

export const getStaticPaths: GetStaticPaths = async () => {
  const items = await fg(`./content/${template}/**/*.md`);

  return {
    paths: items.map((file) => {
      return { params: { slug: fileToUrl(file) } };
    }),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const path = `content/${template}/${params.slug}.md`;
  const client = new ForestryClient();
  const data = await client.getContent<DocumentUnion>({
    path,
  });

  return { props: { path, data } };
};

const Home = (props) => {
  if (!props.data) {
    return <div />;
  }
  const [formData, form] = useForestryForm(props.data);
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
