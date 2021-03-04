import type { TinaCloudTemplate } from "tina-graphql-gateway-cli";

const temp: TinaCloudTemplate = {
  label: "Post",
  name: "post-4",
  fields: [
    {
      label: "Title",
      name: "title",
      type: "text",
    },
    {
      label: "Post",
      type: "reference",
      name: "other_post",
      section: "posts",
    },
  ],
};

export default temp;
