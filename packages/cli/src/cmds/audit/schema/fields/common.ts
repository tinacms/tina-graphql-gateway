const label = {
  type: "string",
  label: "Label",
  description: "The human-friendly label shown above the input field.",
};
const name = {
  type: "string",
  label: "Name",
  description: "The key used in your front matter.",
};
const description = {
  type: "string",
  label: "Description",
  description: "Help text that appears above the field.",
};
const hidden = {
  type: "boolean",
  label: "Hidden",
  description:
    "Hide this field from the form. Used to create content with hidden default values.",
};
const showOnly = {
  type: "object",
  label: "Show Only",
  description:
    "This field will only be shown if the following field equals the following value. Only works with sibling select and toggle fields.",
  properties: {
    field: {
      type: "string",
    },
    value: {
      type: "boolean",
    },
  },
  required: ["field", "value"],
};

export const base = {
  label,
  name,
  description,
  hidden,
  showOnly,
};
export const baseRequired = ["label", "name", "type"];
