import { setupTests } from "../setupTests";

setupTests({
  "with an improper maxSize typemissing config": {
    initial: {
      label: "Image",
      name: "image",
      type: "file",
      config: {
        maxSize: "64",
      },
    },
    errors: [
      {
        dataPath: ".config.maxSize",
        keyword: "type",
      },
    ],
    fixed: {
      label: "Image",
      name: "image",
      type: "file",
      config: {
        maxSize: 64,
      },
    },
  },
});
