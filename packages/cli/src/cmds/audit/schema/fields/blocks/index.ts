import { base, baseRequired } from "../common";

export const BlocksField = {
  $id: "#blocksField",
  label: "Blocks",
  description:
    "A list of unlike Field Groups. Great for allowing a series of different page sections be assembled in a custom way.",
  type: "object",
  properties: {
    ...base,
    type: {
      const: "blocks",
    },
    template_types: {
      type: "array",
      minItems: 1,
      items: {
        type: "string",
      },
    },
    config: {
      type: "object",
      properties: {
        required: { type: "boolean" },
        min: { type: "number" },
        max: { type: "number" },
      },
      minProperties: 1,
      additionalProperties: false,
    },
  },
  additionalProperties: false,
  required: [...baseRequired, "template_types"],
};
