import { setupTests } from "../setupTests";

setupTests({
  "with an invalid default type": {
    initial: {
      type: "image_gallery",
      name: "images",
      label: "Images",
      description: "Used for SEO & Featured Images",
      default: 2,
    },
    errors: [
      {
        dataPath: ".default",
        keyword: "type",
      },
    ],
    fixed: {
      type: "image_gallery",
      name: "images",
      label: "Images",
      description: "Used for SEO & Featured Images",
      default: ["2"],
    },
  },
});
