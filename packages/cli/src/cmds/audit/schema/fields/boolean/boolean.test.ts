import { BooleanField } from "./index";
import { setupTests } from "../setupTests";

const examples = {
  "with a missing label": {
    initial: {
      name: "blocks",
      type: "boolean",
    },
    errors: ["should have required property 'label'"],
  },
};

setupTests(examples, BooleanField);
