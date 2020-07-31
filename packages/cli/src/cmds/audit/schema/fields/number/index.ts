import { base, baseRequired } from "../common";

export const NumberField = {
  $id: "#numberField",
  label: "Number Field",
  description:
    "A number input. Good for integer values such as page weight, amounts, counters etc. ",
  type: "object",
  properties: {
    ...base,
    type: {
      const: "number",
    },
    default: {
      type: "number",
      multipleOf: { $data: "1/config/step" },
      minimum: { $data: "1/config/min" },
      maximum: { $data: "1/config/max" },
    },
    config: {
      type: "object",
      properties: {
        required: {
          type: "boolean",
        },
        min: {
          type: "number",
          multipleOf: { $data: "1/step" },
          maximum: { $data: "1/max" },
        },
        max: {
          type: "number",
          multipleOf: { $data: "1/step" },
          minimum: { $data: "1/min" },
        },
        step: {
          type: "number",
          exclusiveMinimum: 0,
        },
      },
      additionalProperties: false,
    },
  },
  required: baseRequired,
  additionalProperties: false,
};
