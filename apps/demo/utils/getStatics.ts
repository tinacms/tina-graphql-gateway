import { ForestryClient } from "@forestryio/client";
import fg from "fast-glob";
import { DocumentUnion } from "../.forestry/types";

function fileToUrl(template, filepath: string) {
  filepath = filepath.split(`/${template}/`)[1];
  return filepath.replace(/ /g, "-").slice(0, -3).trim();
}

export const getStaticPropsIndex = async ({ template }) => {
  const items = await fg(`./content/${template}/**/*.md`);

  return {
    props: {
      paths: items.map((file) => {
        return fileToUrl(template, file);
      }),
    },
  };
};

export const getStaticPathsUtil = async ({ template }) => {
  const items = await fg(`./content/${template}/**/*.md`);

  return {
    paths: items.map((file) => {
      return { params: { slug: fileToUrl(template, file) } };
    }),
    fallback: true,
  };
};

export const getStaticPropsUtil = async ({ template, params }) => {
  const path = `content/${template}/${params.slug}.md`;
  const client = new ForestryClient();
  const response = await client.getContent<DocumentUnion>({
    path,
  });

  return { props: { path, response } };
};
