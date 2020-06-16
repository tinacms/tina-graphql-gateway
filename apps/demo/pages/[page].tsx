import Head from "next/head";
import { GetStaticProps } from "next";
import { useForm, usePlugin } from "tinacms";
import { onSubmit, prepareValues } from "@forestry/graphql-client";
import { DocumentQueryQuery, BlocksUnion } from "../.forestry/types";
import query from "../.forestry/query";

const DocumentQuery = query;
const API_URL = "http://localhost:4001/graphql";

async function fetchAPI(
  query: string,
  { variables }: { variables: { path: string } }
) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const json = await res.json();
  if (json.errors) {
    console.error(json.errors);
    throw new Error("Failed to fetch API");
  }
  return json.data;
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const data = await fetchAPI(DocumentQuery, {
    variables: { path: `content/pages/${params.page || "home"}.md` },
  });

  const formConfig = {
    id: `content/pages/${params.page}.md`,
    label: `content/pages/${params.page}.md`,
    initialValues: prepareValues(data.document.data),
    fields: data.document.form.fields,
  };

  return { props: { document: data.document, formConfig } };
};

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

const Home = ({ document, formConfig }) => {
  // TODO: use the form data so changes are immediately reflected
  const [formData, form] = useForm({
    ...formConfig,
    onSubmit: (values) => {
      onSubmit({ path: "content/pages/home.md", payload: values });
      // console.log(JSON.stringify(values, null, 2));
      // alert("Check the console for the full output");
    },
  });
  usePlugin(form);

  // TODO: document contains `__typename` which we don't want to be editable
  // so right now we're just merging them, probably a nicer way to do this
  const documentWithFormData = {
    ...document,
    data: formData,
  };

  return (
    <div className="">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageSwitch document={documentWithFormData} />
    </div>
  );
};

const PageSwitch = ({
  document,
}: {
  document: DocumentQueryQuery["document"];
}) => {
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
