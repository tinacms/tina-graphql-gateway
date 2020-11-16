import { DocumentUnion } from "../.tina/types";
import { createClient } from "./createClient";

const client = createClient(false)

export const getSlugs = async ({ template }) => {
  const documents = await client.listDocumentsBySection({ section: template });
  return documents.map(({ breadcrumbs }) => breadcrumbs);
};

export const getContent = async ({ template, params }) => {
  const relativePath = `${params.slug.join("/")}.md`;
  const section = template;
  return {
    ...(await client.getContentForSection<DocumentUnion>({
      relativePath,
      section,
    })),
    relativePath,
    section,
  };
};
