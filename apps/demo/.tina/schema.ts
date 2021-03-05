import { defineSchema } from "tina-graphql-gateway-cli";

export default defineSchema({
  sections: [
    {
      label: "Authors",
      name: "authors",
      path: "content/authors",
      templates: [
        {
          label: "Author",
          name: "author",
          fields: [
            {
              name: "name",
              type: "text",
              label: "Name",
            },
            {
              name: "image",
              type: "text",
              label: "Image",
            },
            {
              name: "accolades",
              type: "group-list",
              label: "Accolades",
              fields: [
                {
                  type: "text",
                  label: "Figure",
                  name: "figure",
                },
                {
                  type: "text",
                  label: "Description",
                  name: "description",
                },
              ],
            },
          ],
        },
      ],
    },
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
            {
              name: "image",
              label: "Image",
              type: "text",
            },
            {
              name: "author",
              label: "Author",
              type: "reference",
              section: "authors",
            },
          ],
        },
      ],
    },
  ],
});
