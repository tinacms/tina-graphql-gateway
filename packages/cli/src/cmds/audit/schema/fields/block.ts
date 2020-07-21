import { base, baseRequired } from "./common";
export const BlocksField = {
  $id: "#blocksField",
  label: "Blocks",
  description:
    "A list of unlike Field Groups. Great for allowing a series of different page sections be assembled in a custom way.",
  type: "object",
  properties: {
    type: {
      const: "blocks",
    },
    ...base,
    template_types: {
      type: "array",
      items: {
        type: "string",
      },
    },
    config: {
      type: "object",
      properties: {
        min: { type: "number" },
        max: { type: "number" },
      },
      minProperties: 1,
      removeIfFails: true,
      additionalProperties: false,
    },
    fields: {
      $ref: "#/definitions/allFields",
    },
  },
  additionalProperties: false,
  required: baseRequired,
};
