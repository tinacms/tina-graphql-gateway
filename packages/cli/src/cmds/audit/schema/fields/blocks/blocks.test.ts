import { BlocksField } from "./index";
import { setupTests } from "../setupTests";

const blocksDef = {
  "config with empty values": {
    initial: {
      name: "blocks",
      type: "blocks",
      label: "Blocks",
      template_types: ["sidecar"],
      config: {
        min: null,
      },
    },
    errors: ["should be number"],
    fixed: {
      name: "blocks",
      type: "blocks",
      label: "Blocks",
      template_types: ["sidecar"],
    },
  },
  "config with an incorrect min type": {
    initial: {
      name: "blocks",
      type: "blocks",
      label: "Blocks",
      template_types: ["sidecar"],
      config: {
        min: "2",
      },
    },
    errors: ["should be number"],
    fixed: {
      name: "blocks",
      type: "blocks",
      label: "Blocks",
      template_types: ["sidecar"],
      config: {
        min: 2,
      },
    },
  },
  "missing template type": {
    initial: {
      name: "blocks",
      type: "blocks",
      label: "Blocks",
      config: {
        min: 2,
      },
    },
    errors: ["should have required property 'template_types'"],
  },
  "empty template type": {
    initial: {
      name: "blocks",
      type: "blocks",
      label: "Blocks",
      template_types: [],
      config: {
        min: 2,
      },
    },
    errors: ["should NOT have fewer than 1 items"],
  },
};

setupTests(blocksDef, BlocksField);
