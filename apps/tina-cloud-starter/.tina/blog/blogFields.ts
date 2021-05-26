import { TinaField } from "tina-graphql-gateway-cli";

export const BlogFields: TinaField[] = [
  {
    type: "text",
    label: "Title",
    name: "title",
  },
  {
    type: "reference",
    label: "Author",
    name: "author",
    collection: "authors",
  },
];
