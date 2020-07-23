import { setupTests } from "../setupTests";

setupTests({
  "with a missing config": {
    initial: {
      name: "figure",
      type: "textarea",
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
      type: "textarea",
      default: "2",
      config: {
        required: false,
      },
      label: "Figure",
      description: "A single number or word to emphasize",
    },
  },
});
