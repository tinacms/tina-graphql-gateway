import { base, baseRequired } from "../common";

export const ImageField = {
  $id: "#imageField",
  label: "Image Field",
  description:
    "A single file input that adds assets to the Media Library. Good for a featured image or a profile picture. ",
  type: "object",
  properties: {
    type: {
      const: "file",
    },
    ...base,
    default: {
      type: "string",
      minLength: 1,
      removeIfFails: true,
    },
    config: {
      type: "object",
      properties: {
        required: { type: "boolean" },
        maxSize: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
  required: baseRequired,
};
