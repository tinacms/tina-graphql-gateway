import { base, baseRequired } from "../common";

export const DateField = {
  $id: "#dateField",
  label: "Date Field",
  description:
    "A date and time picker. Good for date values such as page created, page published etc.",
  type: "object",
  properties: {
    type: {
      const: "datetime",
    },
    ...base,
    default: {
      type: "string",
      removeIfFails: true,
      anyOf: [
        {
          type: "string",
          const: "now",
        },
        {
          type: "string",
          format: "date-time",
        },
      ],
    },
    config: {
      type: "object",
      properties: {
        required: { type: "boolean" },
        date_format: { type: "string" },
        time_format: { type: "string" },
        export_format: { type: "string" },
        display_utc: { type: "boolean" },
      },
      additionalProperties: false,
    },
  },
  required: [...baseRequired],
  additionalProperties: false,
};
