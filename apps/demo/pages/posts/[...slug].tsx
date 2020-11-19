import React from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import Head from "next/head";
import { useForestryForm } from "@forestryio/client";
import { getContent, getSlugs } from "../../utils/getStatics";

const template = "posts";

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await getSlugs({ template });
  return {
    paths: slugs.map((slug) => {
      return { params: { slug } };
    }),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async (props) => {
  const response = await getContent({
    template,
    params: props.params,
  });
  return { props: response };
};

const Home = (props) => {
  const { modifiedValues, data, mixed } = useForestryForm(props);

  return (
    <>
      <Head>
        <link
          href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css"
          rel="stylesheet"
        />
      </Head>
      <div className="grid grid-cols-2">
        <div style={{ height: "90vh" }} className="p-24 overflow-scroll">
          <h3 className="mt-2 text-2xl font-extrabold text-gray-900 sm:text-xl">
            Data from our GraphQL query
          </h3>
          <pre>
            <code>{JSON.stringify(data, null, 2)}</code>
          </pre>
          <h3 className="mt-12 text-2xl font-extrabold text-gray-900 sm:text-xl">
            Data from useForm's "initialValues"
          </h3>
          <pre>
            <code>{JSON.stringify(modifiedValues, null, 2)}</code>
          </pre>
          <h3 className="mt-12 text-2xl font-extrabold text-gray-900 sm:text-xl">
            Mixed
          </h3>
          <pre>
            <code>{JSON.stringify(mixed, null, 2)}</code>
          </pre>
        </div>
        <div className="max-w-md mx-auto flex items-center justify-center">
          <div className="flex flex-col space-y-4">
            <Card
              image={data.image}
              hashtags={data.hashtags}
              title={data.title}
              excerpt={data.excerpt}
              author={data.author.node.data}
            />
            <Card
              image={mixed.image}
              hashtags={mixed.hashtags}
              title={mixed.title}
              excerpt={mixed.excerpt}
              author={mixed.author.node.data}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

const Card = (props: {
  image: string;
  hashtags: string[];
  title: string;
  excerpt: string;
  author: {
    name: string;
    image;
    string;
  };
}) => {
  return (
    <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
      <div className="flex-shrink-0">
        <img className="h-48 w-full object-cover" src={props.image} alt="" />
      </div>
      <div className="flex-1 bg-white p-6 flex flex-col justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-indigo-600">
            <a href="#" className="hover:underline">
              {props.hashtags.join(", ")}
            </a>
          </p>
          <a href="#" className="block mt-2">
            <p className="text-xl font-semibold text-gray-900">{props.title}</p>
            <p className="mt-3 text-base text-gray-500">{props.excerpt}</p>
          </a>
        </div>
        <div className="mt-6 flex items-center">
          <div className="flex-shrink-0">
            <a href="#">
              <span className="sr-only">{props.author.name}</span>
              <img
                className="h-10 w-10 rounded-full"
                src={props.author.image}
                alt=""
              />
            </a>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              <a href="#" className="hover:underline">
                {props.author.name}
              </a>
            </p>
            <div className="flex space-x-1 text-sm text-gray-500">
              <time dateTime="2020-03-16">Mar 16, 2020</time>
              <span aria-hidden="true">·</span>
              <span>6 min read</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
