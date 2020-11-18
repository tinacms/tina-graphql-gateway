import { createClient } from "./createClient";
import gql from "graphql-tag";

const client = createClient(false);

export const getSlugs = async ({ template }) => {
  const documents = await client.listDocumentsBySection({ section: template });
  return documents.map(({ breadcrumbs }) => breadcrumbs);
};

export const getContent = async ({ template, params }) => {
  const relativePath = `${params.slug.join("/")}.md`;
  const section = template;
  const content = await client.getContentForSection<object>({
    relativePath,
    section,
  });
  return {
    ...content,
    relativePath,
    section,
  };
};
