import { defineSchema } from "tina-graphql-gateway-cli";
import post from "./models/post";

export default defineSchema({
  sections: [
    {
      label: "Posts",
      path: "content/posts",
      templates: [
        post,
        {
          name: "post-3",
          label: "My Poster",
          fields: [
            {
              type: "text",
              label: "My Title",
              name: "my_titlez",
            },
            {
              type: "blocks",
              label: "My Blocks",
              name: "my_blocs",
              templates: [
                {
                  label: "My Block template",
                  name: "my-block-template",
                  fields: [
                    {
                      type: "text",
                      label: "My Item Name",
                      name: "my-tiem-name",
                    },
                    {
                      type: "group",
                      name: "my_group",
                      label: "My Group",
                      fields: [
                        {
                          name: "my_group_item",
                          label: "My Group Item",
                          type: "group",
                          fields: [
                            {
                              type: "text",
                              label: "My Group group Item",
                              name: "my_group_group_item",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});
