import React from "react";
import gql from "graphql-tag";
import { createClient } from "../utils/createClient";
import { useForm, usePlugin } from "tinacms";
import { Card } from "../components/card";
import Head from "next/head";

const client = createClient(false);

export async function getServerSideProps() {
  const post = await getPost({ relativePath: "welcome.md" });
  return {
    props: {
      post: post,
      author: await getAuthor({
        path: post.document.node.initialValues.author,
      }),
    },
  };
}

const Main = (props) => {
  const [authorValues, setAuthorValues] = React.useState(
    props.author.document.node.data
  );

  const [tinaPostValues, postForm] = useForm({
    id: "tinapost",
    label: "TinaPost",
    fields: props.post.document.node.form.fields,
    initialValues: props.post.document.node.initialValues,
    onSubmit: (values) => {
      // not required for demonstration purposes
    },
  });
  usePlugin(postForm);

  React.useEffect(() => {
    const refetchAuthor = async () => {
      const a = await getAuthor({ path: tinaPostValues.author });
      setAuthorValues(a.document.node.initialValues);
    };
    refetchAuthor();
  }, [tinaPostValues.author]);

  return (
    <>
      <Head>
        <link
          href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css"
          rel="stylesheet"
        />
      </Head>
      <div className="h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto">
          <Card
            title={tinaPostValues.title}
            image={tinaPostValues.image}
            hashtags={tinaPostValues.hashtags}
            excerpt={tinaPostValues.excerpt}
            author={authorValues}
          />
        </div>
      </div>
    </>
  );
};

export default Main;

const getPost = async ({ relativePath }: { relativePath: string }) => {
  const section = "posts";
  const query = gql`
    query DocumentQuery($relativePath: String!, $section: String!) {
      document(relativePath: $relativePath, section: $section) {
        node {
          __typename
          ... on Post {
            data {
              title
              image
              excerpt
              hashtags
            }
          }
        }
      }
    }
  `;
  return client.requestWithForm<object>({
    query,
    variables: {
      relativePath,
      section,
    },
  });
};

const getAuthor = async ({ path }: { path: string }) => {
  const authorArr = path.split("/");
  const relativePath = authorArr[authorArr.length - 1];
  const section = "authors";
  const query = gql`
    query DocumentQuery($relativePath: String!, $section: String!) {
      document(relativePath: $relativePath, section: $section) {
        node {
          __typename
          ... on Author {
            data {
              name
              image
            }
          }
        }
      }
    }
  `;
  return client.requestWithForm<object>({
    query,
    variables: {
      relativePath,
      section,
    },
  });
};
