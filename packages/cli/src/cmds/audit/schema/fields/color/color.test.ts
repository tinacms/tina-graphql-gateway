import { setupTests } from "../setupTests";

setupTests({
  "with a missing label": {
    initial: {
      name: "color",
      type: "color",
      config: {
        color_format: "Hex",
      },
    },
    errors: [{ dataPath: "", keyword: "required" }],
  },
  "with a missing config": {
    initial: {
      name: "color",
      label: "My Color",
      type: "color",
    },
    errors: [{ dataPath: "", keyword: "required" }],
  },
  "without a color_format": {
    initial: {
      name: "color",
      label: "My Color",
      type: "color",
      config: {
        required: true,
      },
    },
    errors: [
      {
        dataPath: ".config",
        keyword: "required",
      },
    ],
  },
  "with an invalid color_format": {
    initial: {
      name: "color",
      label: "My Color",
      type: "color",
      config: {
        color_format: "Whoa!",
      },
    },
    errors: [
      {
        dataPath: ".config.color_format",
        keyword: "enum",
      },
    ],
  },
});
