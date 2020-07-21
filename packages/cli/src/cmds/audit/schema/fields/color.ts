import { base, baseRequired } from "./common";

export const ColorField = {
  $id: "#colorField",
  label: "Color Picker Field",
  description: "",
  type: "object",
  properties: {
    type: {
      const: "color",
    },
    ...base,
    config: {
      type: "object",
      properties: {
        required: { type: "boolean" },
        color_format: { type: "string", enum: ["RGB", "Hex"] },
      },
      additionalProperties: false,
      required: ["color_format"],
    },
  },
  additionalProperties: false,
  required: [...baseRequired, "config"],
};
