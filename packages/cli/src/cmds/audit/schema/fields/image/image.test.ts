import { setupTests } from "../setupTests";

setupTests({
  "with maxSize set as a string": {
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
  "with an empty string default": {
    initial: {
      default: "",
      label: "Image",
      name: "image",
      type: "file",
      config: {
        maxSize: 64,
      },
    },
    errors: [
      {
        dataPath: ".default",
        keyword: "minLength",
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
