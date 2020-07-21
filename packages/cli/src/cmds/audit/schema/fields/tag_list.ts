import { base, baseRequired } from "./common";

export const TagField = {
  $id: "#tagField",
  label: "Tags Field",
  description:
    "A list of strings to make multiple selections displayed inline. Good for page categories, page tags etc.",
  type: "object",
  properties: {
    type: {
      const: "tag_list",
    },
    ...base,
    default: {
      type: "array",
      items: {
        type: "string",
      },
    },
    config: {
      type: "object",
      properties: {
        required: { type: "boolean" },
      },
      additionalProperties: false,
    },
  },
  required: baseRequired,
};
