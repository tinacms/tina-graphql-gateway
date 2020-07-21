import { base, baseRequired } from "./common";

export const TextAreaField = {
  $id: "#textAreaField",
  label: "Textarea",
  description:
    "Multi-line text input. Good for page descriptions, article summaries etc. ",
  type: "object",
  properties: {
    type: {
      const: "textarea",
    },
    ...base,
    default: { type: "string" },
    config: {
      type: "object",
      properties: {
        required: { type: "boolean" },
        wysiwyg: {
          type: "boolean",
          title: "WYSIWYG Editor",
          description:
            "Whether or not the editor should present a rich-text editor",
        },
        min: { type: "number" },
        max: { type: "number" },
        // FIXME: this should not be present when wysiwyg is false
        schema: {
          type: "object",
          properties: {
            format: { type: "string", enum: ["html", "markdown"] },
          },
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  required: baseRequired,
  additionalProperties: false,
};
