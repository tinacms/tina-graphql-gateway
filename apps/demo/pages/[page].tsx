import { GetStaticProps } from "next";
import { usePlugin } from "tinacms";
import { ForestryClient, useForestryForm } from "@forestryio/client";
import { DocumentUnion, BlocksUnion, DocumentInput } from "../.forestry/types";
import config from "../.forestry/config";
import { ContentCreatorPlugin } from "../utils/contentCreatorPlugin";
import query from "../.forestry/query";

const fg = require("fast-glob");

const URL = config.serverURL;

function fileToUrl(filepath: string) {
  filepath = filepath.split(`/pages/`)[1];
  return filepath.replace(/ /g, "-").slice(0, -3).trim();
}

export async function getStaticPaths() {
  const pages = await fg(`./content/pages/**/*.md`);

  return {
    paths: pages.map((file) => {
      return { params: { page: fileToUrl(file) } };
    }),
    fallback: true,
  };
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const path = `content/pages/${params.page}.md`;
  const client = new ForestryClient({ serverURL: URL, query });
  const response = await client.getContent<DocumentUnion>({
    path,
  });

  return { props: { path, response } };
};

const Home = (props) => {
  const [formData, form] = useForestryForm(props.response, URL, {
    image: (field) => {
      return {
        ...field,
        previewSrc: (_, { input }) => {
          return input.value;
        },
        uploadDir: () => "/not/yet/implemented/",
      };
    },
  });
  usePlugin(form);

  const createPagePlugin = new ContentCreatorPlugin<
    DocumentInput & { title: string }
  >({
    label: "Add Page",
    fields: [
      { name: "title", label: "Title", component: "text", required: true },
    ],
    filename: ({ title }) => {
      return `content/pages/${title.replace(/\s+/, "-").toLowerCase()}.md`;
    },
    body: () => ``,
    frontmatter: ({ title }) => {
      //remove any other dirs from the title, return only filename
      const id = `/pages/${title.replace(/\s+/, "-").toLowerCase()}`;
      return {
        title,
        id,
        prev: null,
        next: null,
      };
    },
  });

  usePlugin(createPagePlugin);

  return <PageSwitch document={formData} />;
};

const PageSwitch = ({ document }: { document: DocumentUnion }) => {
  switch (document.__typename) {
    case "BlockPage":
      return <BlockOutput blocks={document.data.blocks} />;
    default:
      return <div>Other document renderers</div>;
  }
};

const BlockOutput = ({ blocks }: { blocks: BlocksUnion[] }) => {
  return (
    <>
      {blocks.map((block) => {
        return (
          <>
            <h3>{block.__typename}</h3>
            <pre>
              <code>{JSON.stringify(block, null, 2)}</code>
            </pre>
          </>
        );
      })}
    </>
  );
};

export default Home;
