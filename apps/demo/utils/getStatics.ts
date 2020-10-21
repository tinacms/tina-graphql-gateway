import { ForestryClient } from "@forestryio/client";
import { DocumentUnion } from "../.forestry/types";

const client = new ForestryClient(process.env.SITE_CLIENT_ID);

export const getSlugs = async ({ template }) => {
  const documents = await client.listDocumentsBySection({ section: template });
  return documents.map(({ breadcrumbs }) => breadcrumbs);
};

export const getContent = async ({ template, params }) => {
  return await client.getContentForSection<DocumentUnion>({
    relativePath: `${params.slug.join("/")}.md`,
    section: template,
  });
};
