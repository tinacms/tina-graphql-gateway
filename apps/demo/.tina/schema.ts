import { defineSchema } from "tina-graphql-gateway-cli";

export default defineSchema({
  sections: [
    {
      label: "Posts",
      name: "posts",
      path: "content/posts",
      templates: [
        {
          label: "Post",
          name: "post",
          fields: [
            {
              name: "title",
              label: "Title",
              type: "text",
            },
          ],
        },
      ],
    },
  ],
});
