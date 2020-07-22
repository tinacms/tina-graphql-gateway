import { base, baseRequired } from "../common";

export const FieldGroupField = {
  $id: "#fieldGroupField",
  label: "Field Group",
  description:
    "A set of fields combined into one field. Good for objects that come in sets (e.g. a site's footer).",
  type: "object",
  properties: {
    type: {
      const: "field_group",
    },
    ...base,
    config: {
      type: "object",
      properties: {
        required: { type: "boolean" },
      },
      additionalProperties: false,
    },
    fields: {
      $ref: "#/definitions/allFields",
    },
  },
  additionalProperties: false,
  required: [...baseRequired, "fields"],
};
