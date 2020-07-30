import { GetStaticProps, GetStaticPaths } from "next";
import { usePlugin } from "tinacms";
import { useForestryForm } from "@forestryio/client";
import { DocumentInput } from "../../.forestry/types";
import { ContentCreatorPlugin } from "../../utils/contentCreatorPlugin";
import { getStaticPropsUtil, getStaticPathsUtil } from "../../utils/getStatics";

const template = "pages";

export const getStaticPaths: GetStaticPaths = async () => {
  return getStaticPathsUtil({ template });
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  return getStaticPropsUtil({ template, params });
};

const Home = (props) => {
  const [formData, form] = useForestryForm(props.response);
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
