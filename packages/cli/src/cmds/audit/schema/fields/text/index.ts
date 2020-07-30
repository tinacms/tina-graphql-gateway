import { base, baseRequired } from "../common";

export const TextField = {
  $id: "#textField",
  label: "Text Field",
  description:
    "Single line text input. Good for page titles, feature headlines etc.",
  type: "object",
  properties: {
    ...base,
    type: {
      const: "text",
    },
    default: {
      type: "string",
    },
    config: {
      type: "object",
      properties: {
        required: { type: "boolean" },
        min: { type: "number" },
        max: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
  required: baseRequired,
};
