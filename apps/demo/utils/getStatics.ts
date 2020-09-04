import { ForestryClient } from "@forestryio/client";
import fg from "fast-glob";
import { DocumentUnion } from "../.forestry/types";

function fileToUrl(template, filepath: string) {
  filepath = filepath.split(`/${template}/`)[1];
  return filepath.replace(/ /g, "-").slice(0, -3).trim();
}

export const getSlugs = async ({ template }) => {
  const items = await fg(`./content/${template}/**/*.md`);

  return items.map((file) => {
    return fileToUrl(template, file);
  });
};

export const getContent = async ({ template, params }) => {
  const path = `content/${template}/${params.slug}.md`;
  const client = new ForestryClient(process.env.SITE_CLIENT_ID);
  const response = await client.getContent<DocumentUnion>({
    path,
  });

  return { path, response };
};
