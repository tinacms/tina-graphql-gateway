import { TinaCloudCollection } from "tina-graphql-gateway-cli";

export const AuthorCollection: TinaCloudCollection = {
  label: "Authors",
  name: "authors",
  path: "content/authors",
  templates: [
    {
      label: "Author",
      name: "author",
      fields: [
        {
          type: "text",
          label: "Name",
          name: "name",
        },
        {
          type: "text",
          label: "Avatar",
          name: "avatar",
        },
      ],
    },
  ],
};
