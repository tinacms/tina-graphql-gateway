import { base, baseRequired } from "./common";

export const SelectField = {
  $id: "#selectField",
  label: "Select Field",
  description: "A dropdown to make a single selection from a set of options. ",
  type: "object",
  properties: {
    type: {
      const: "select",
    },
    ...base,
    default: {
      type: "string",
      removeIfFails: true,
    },
    config: {
      type: "object",
      properties: {
        source: {
          type: "object",
          properties: {
            type: { enum: ["simple", "pages", "documents"] },
          },
        },
      },
      allOf: [
        {
          if: {
            properties: {
              source: {
                properties: {
                  type: { const: "simple" },
                },
              },
            },
          },
          then: {
            additionalProperties: false,
            properties: {
              required: { type: "boolean" },
              source: {
                properties: {
                  type: { const: "simple" },
                },
                required: ["type"],
                additionalProperties: false,
              },
              options: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
          },
        },
        {
          if: {
            properties: {
              source: {
                properties: {
                  type: { const: "pages" },
                },
              },
            },
          },
          then: {
            properties: {
              required: { type: "boolean" },
              source: {
                properties: {
                  type: { const: "pages" },
                  section: { type: "string" },
                },
                required: ["type", "section"],
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
        },
        {
          if: {
            properties: {
              source: {
                properties: {
                  type: { const: "documents" },
                },
              },
            },
          },
          then: {
            properties: {
              required: { type: "boolean" },
              source: {
                properties: {
                  type: { const: "documents" },
                  section: { type: "string" },
                  file: { type: "string" },
                  path: { type: "string" },
                },
                required: ["type", "section", "file", "path"],
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
        },
      ],
    },
  },
  additionalProperties: false,
  required: baseRequired,
};
