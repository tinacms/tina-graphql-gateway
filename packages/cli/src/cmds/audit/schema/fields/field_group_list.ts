import { base, baseRequired } from "./common";

export const FieldGroupListField = {
  $id: "#fieldGroupListField",
  label: "Field Group List",
  description:
    "A list of repeating Field Groups. Good for an object that can be reused multiple times on the same page (e.g. list of authors).",
  type: "object",
  properties: {
    type: {
      const: "field_group_list",
    },
    ...base,
    config: {
      type: "object",
      properties: {
        required: { type: "boolean" },
        use_select: { type: "boolean" },
        labelField: { type: "string" },
        min: { type: "number" },
        max: { type: "number" },
      },
      additionalProperties: false,
    },
    fields: {
      $ref: "#/definitions/allFields",
    },
  },
  required: [...baseRequired, "fields"],
  additionalProperties: false,
};
