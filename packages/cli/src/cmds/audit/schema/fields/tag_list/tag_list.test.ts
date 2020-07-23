import { setupTests } from "../setupTests";

setupTests({
  "with an invalid default type": {
    initial: {
      name: "authors",
      label: "Authors",
      type: "tag_list",
      hidden: true,
      default: 2,
    },
    errors: [
      {
        dataPath: ".default",
        keyword: "type",
      },
    ],
    fixed: {
      name: "authors",
      label: "Authors",
      type: "tag_list",
      hidden: true,
      default: ["2"],
    },
  },
});
