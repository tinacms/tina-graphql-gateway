import { setupTests } from "../setupTests";

const base = {
  name: "blocks",
  type: "blocks",
  label: "Blocks",
};

setupTests({
  "config with null properties": {
    initial: {
      ...base,
      template_types: ["sidecar"],
      config: {
        min: null,
      },
    },
    errors: [
      {
        dataPath: ".config.min",
        keyword: "type",
      },
    ],
    fixed: {
      ...base,
      template_types: ["sidecar"],
    },
  },
  "config with an incorrect type": {
    initial: {
      ...base,
      template_types: ["sidecar"],
      config: {
        min: "2",
      },
    },
    errors: [
      {
        dataPath: ".config.min",
        keyword: "type",
      },
    ],
    fixed: {
      ...base,
      template_types: ["sidecar"],
      config: {
        min: 2,
      },
    },
  },
  "missing template type": {
    initial: {
      ...base,
    },
    errors: [
      {
        dataPath: "",
        keyword: "required",
      },
    ],
  },
  "empty template type": {
    initial: {
      ...base,
      template_types: [],
    },
    errors: [
      {
        dataPath: ".template_types",
        keyword: "minItems",
      },
    ],
  },
});
