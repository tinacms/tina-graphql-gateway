import { defineSchema } from "tina-graphql-gateway-cli";

export default defineSchema({
  sections: [
    {
      label: "Posts",
      path: "content/posts",
      templates: [
        {
          name: "post",
          label: "My Poster",
          fields: [
            {
              type: "text",
              label: "My Title",
              name: "title",
            },
          ],
        },
      ],
    },
  ],
});
