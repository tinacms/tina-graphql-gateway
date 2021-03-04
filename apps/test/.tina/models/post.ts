import type { TinaCloudTemplate } from "tina-graphql-gateway-cli";

const temp: TinaCloudTemplate = {
  label: "Post",
  name: "post-4",
  fields: [
    {
      label: "Title",
      name: "titlez",
      type: "text",
    },
    {
      label: "Author",
      type: "reference",
      name: "author",
      section: "posts",
    },
  ],
};

export default temp;
