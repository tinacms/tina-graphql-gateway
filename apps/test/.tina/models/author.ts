import { defineModel } from "tina-graphql-gateway-cli";

export default defineModel({
  label: "Author",
  name: "author",
  fields: [
    {
      label: "Name",
      name: "name",
      type: "text",
    },
  ],
});
