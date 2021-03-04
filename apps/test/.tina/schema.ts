import { defineSchema } from "tina-graphql-gateway-cli";

export default defineSchema({
  sections: [
    {
      label: "Posts",
      name: "posts",
      path: "content/posts",
      templates: [
        {
          name: "post",
          label: "Post",
          fields: [
            {
              type: "text",
              label: "Title",
              name: "title",
            },
          ],
        },
      ],
    },
  ],
});
