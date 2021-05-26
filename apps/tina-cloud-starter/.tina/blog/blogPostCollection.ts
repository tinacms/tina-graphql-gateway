import { TinaCloudCollection } from "tina-graphql-gateway-cli";

import { BlogFields } from "./blogFields";
export const BlogPostCollection: TinaCloudCollection = {
  label: "Blog Posts",
  name: "posts",
  path: "content/posts",
  templates: [
    {
      label: "Article",
      name: "article",
      fields: BlogFields,
    },
  ],
};
