import { setupTests } from "../setupTests";

setupTests({
  "with a missing label": {
    initial: {
      name: "figure",
      type: "text",
      config: {
        required: false,
      },
      description: "A single number or word to emphasize",
    },
    errors: [
      {
        dataPath: "",
        keyword: "required",
      },
    ],
  },
  "with a missing config": {
    initial: {
      name: "figure",
      type: "text",
      default: 2,
      config: {
        required: false,
      },
      label: "Figure",
      description: "A single number or word to emphasize",
    },
    errors: [
      {
        dataPath: ".default",
        keyword: "type",
      },
    ],
    fixed: {
      name: "figure",
      type: "text",
      default: "2",
      config: {
        required: false,
      },
      label: "Figure",
      description: "A single number or word to emphasize",
    },
  },
});
