import { base, baseRequired } from "../common";

export const IncludeField = {
  $id: "#includeField",
  label: "Include Template",
  description:
    "Include the fields of another Front Matter Template into the current one. ",
  type: "object",
  properties: {
    type: {
      const: "include",
    },
    template: {
      type: "string",
      label: "Template",
      description: "The template you'd like to include",
    },
    ...base,
    config: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  additionalProperties: false,
  required: baseRequired,
};
