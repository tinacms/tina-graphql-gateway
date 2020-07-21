import { base, baseRequired } from "./common";

export const BooleanField = {
  $id: "#booleanField",
  label: "Toggle Field",
  description:
    "A true or false toggle. Good for components that can be turned on/off on a by-page basis such as page sections. ",
  type: "object",
  properties: {
    type: {
      const: "boolean",
    },
    ...base,
  },
  additionalProperties: false,
  required: baseRequired,
};
