import { GetStaticProps } from "next";
import { useForm, usePlugin } from "tinacms";
import { forestryFetch, useForestryForm } from "@forestryio/client";
import {
  DocumentUnion,
  BlocksUnion,
  BlockPageInput,
  BlockPageDataInput,
  DocumentInput,
} from "../.forestry/types";
import config from "../.forestry/config";
import query from "../.forestry/query";
import { ContentCreatorPlugin } from "../utils/contentCreatorPlugin";

const URL = config.serverURL;

export async function getStaticPaths() {
  return {
    paths: [
      { params: { page: "home" } },
      { params: { page: "about" } },
      { params: { page: "services" } },
    ],
    fallback: false,
  };
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const path = `content/pages/${params.page}.md`;
  const response = await forestryFetch<DocumentUnion>(URL, {
    query,
    path,
  });

  return { props: { path, response } };
};

const Home = (props) => {
  // FIXME: running into issues with multiple instances so passing
  // useForm by reference rather than importing it
  const [formData, form] = useForestryForm(props.response, useForm, URL, {
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
