import { ForestryClient } from "@forestryio/client";
import { DocumentUnion } from "../.forestry/types";

const client = new ForestryClient(process.env.SITE_CLIENT_ID);

export const getSlugs = async ({ template }) => {
  const documents = await client.listDocumentsBySection({ section: template });
  return documents.map(({ breadcrumbs }) => breadcrumbs);
};

export const getContent = async ({ template, params }) => {
  const relativePath = `${params.slug.join("/")}.md`;
  const section = template;
  const meh = {
    ...(await client.getContentForSection<DocumentUnion>({
      relativePath,
      section,
    })),
    relativePath,
    section,
  };

  return meh;
};
