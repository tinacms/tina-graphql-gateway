import { ColorField } from "./index";
import { setupTests } from "../setupTests";

const examples = {
  "with a missing config": {
    initial: {
      name: "color",
      label: "My Color",
      type: "color",
    },
    errors: ["should have required property 'config'"],
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
    errors: ["should have required property 'color_format'"],
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
    errors: ["should be equal to one of the allowed values"],
  },
};

setupTests(examples, ColorField);
