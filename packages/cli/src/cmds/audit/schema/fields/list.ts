import { base, baseRequired } from "./common";

const additionalListConfig = {
  use_select: { type: "boolean" },
  required: { type: "boolean" },
  min: { type: "number" },
  max: { type: "number" },
};

export const ListField = {
  $id: "#listField",
  label: "List Field",
  description:
    "A list of strings to make multiple selections. The selection is displayed as a list that can be sorted (e.g. related pages). ",
  type: "object",
  properties: {
    type: {
      const: "list",
    },
    ...base,
    default: {
      type: "array",
      items: {
        type: "string",
      },
    },
    config: {
      type: "object",
      properties: {
        use_select: { type: "boolean" },
        source: {
          type: "object",
          properties: {
            type: { enum: ["simple", "pages", "documents", "datafiles"] },
          },
        },
      },
      allOf: [
        {
          if: {
            properties: {
              use_select: { const: false },
            },
          },
          then: {
            additionalProperties: false,
            properties: additionalListConfig,
          },
          else: {
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
                  required: ["source", "options"],
                  properties: {
                    ...additionalListConfig,
                    options: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                    },
                    source: {
                      properties: {
                        type: { const: "simple" },
                      },
                      required: ["type"],
                      additionalProperties: false,
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
                    ...additionalListConfig,
                    source: {
                      properties: {
                        type: { const: "pages" },
                        section: { type: "string" },
                      },
                      required: ["type", "section"],
                      additionalProperties: false,
                    },
                  },
                  required: ["source"],
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
                    ...additionalListConfig,
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
                  required: ["source"],
                  additionalProperties: false,
                },
              },
              // I have no idea what this is
              {
                if: {
                  properties: {
                    source: {
                      properties: {
                        type: { const: "datafiles" },
                      },
                    },
                  },
                },
                then: {
                  properties: {
                    ...additionalListConfig,
                    source: {
                      properties: {
                        type: { const: "datafiles" },
                      },
                      required: ["type"],
                      additionalProperties: false,
                    },
                  },
                  required: ["source"],
                  additionalProperties: false,
                },
              },
            ],
          },
        },
      ],
    },
  },
  additionalProperties: false,
  required: baseRequired,
};
