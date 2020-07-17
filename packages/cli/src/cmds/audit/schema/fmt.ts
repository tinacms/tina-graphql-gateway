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
const base = {
  label,
  name,
  description,
  hidden,
  showOnly,
};
const baseRequired = ["label", "name", "type"];

export const TextField = {
  $id: "#textField",
  label: "Text Field",
  description:
    "Single line text input. Good for page titles, feature headlines etc.",
  type: "object",
  properties: {
    ...base,
    type: {
      const: "text",
    },
    default: {
      type: "string",
    },
    config: {
      type: "object",
      properties: {
        required: { type: "boolean" },
        min: { type: ["number", "null"] },
        max: { type: ["number", "null"] },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
  required: baseRequired,
};
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
    },
    // FIXME: sometimes this is present here instead of in the config
    required: {
      type: "boolean",
    },
    config: {
      type: "object",
      properties: {
        required: {
          type: "boolean",
        },
        min: { type: ["number", "null"] },
        max: { type: ["number", "null"] },
        step: { type: ["number", "null"] },
      },
      additionalProperties: false,
    },
  },
  required: baseRequired,
  additionalProperties: false,
};
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
export const TagField = {
  $id: "#tagField",
  label: "Tags Field",
  description:
    "A list of strings to make multiple selections displayed inline. Good for page categories, page tags etc.",
  type: "object",
  properties: {
    type: {
      const: "tag_list",
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
        required: { type: "boolean" },
      },
      additionalProperties: false,
    },
  },
  required: baseRequired,
};
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
    },
    config: {
      type: "object",
      properties: {
        required: { type: "boolean" },
        date_format: { type: ["string", "null"] },
        time_format: { type: ["string", "null"] },
        export_format: { type: ["string", "null"] },
        display_utc: { type: "boolean" },
      },
      additionalProperties: false,
    },
  },
  required: baseRequired,
  additionalProperties: false,
};

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
        min: { type: ["number", "null"] },
        max: { type: ["number", "null"] },
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
    },
    config: {
      type: "object",
      properties: {
        required: { type: "boolean" },
        options: {
          // FIXME: this is empty when the type is pages or document
          type: "array",
        },
        source: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["simple", "pages", "documents"],
            },
          },
          allOf: [
            {
              if: {
                properties: {
                  type: { const: "simple" },
                },
              },
              then: {
                type: "object",
                properties: {
                  type: { const: "simple" },
                  section: { type: ["string", "null"] },
                  file: { type: ["string", "null"] },
                  path: { type: ["string", "null"] },
                },
                required: ["type"],
                additionalProperties: true, // FIXME: ideally when "simple" no other properties
              },
            },
            {
              if: {
                properties: {
                  type: { const: "pages" },
                },
              },
              then: {
                type: "object",
                properties: {
                  type: { const: "pages" },
                  section: { type: ["string", "null"] },
                  file: { type: ["string", "null"] },
                  path: { type: ["string", "null"] },
                },
                required: ["type", "section", "file", "path"],
                additionalProperties: false,
              },
            },
            {
              if: {
                properties: {
                  type: { const: "documents" },
                },
              },
              then: {
                type: "object",
                properties: {
                  type: { const: "documents" },
                  section: { type: ["string", "null"] },
                  file: { type: ["string", "null"] },
                  path: { type: ["string", "null"] },
                },
                required: ["type", "section", "file", "path"],
                additionalProperties: false,
              },
            },
          ],
          required: ["type"],
        },
      },
    },
  },
  additionalProperties: false,
  required: baseRequired,
};
export const ImageField = {
  $id: "#imageField",
  label: "Image Field",
  description:
    "A single file input that adds assets to the Media Library. Good for a featured image or a profile picture. ",
  type: "object",
  properties: {
    type: {
      const: "file",
    },
    ...base,
    config: {
      type: "object",
      properties: {
        required: { type: "boolean" },
        maxSize: { type: ["number", "null"] },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
  required: baseRequired,
};
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
      description:
        "Include fields of another Front Matter Template into the current one. Good for commonly-reused fields such as SEO information.",
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
      type: "array", // FIXME: for some reason this is an empty [] when no default is defined
    },
    config: {
      type: "object",
      properties: {
        use_select: { type: "boolean" },
        min: { type: ["number", "null"] },
        max: { type: ["number", "null"] },
        options: {
          // FIXME: this should only be present when source.type === 'simple'
          type: "array",
          items: { type: "string" },
        },
        source: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["simple", "pages", "documents", "datafiles"],
            },
          },
          allOf: [
            {
              if: {
                properties: {
                  type: { const: "simple" },
                },
              },
              then: {
                type: "object",
                properties: {
                  type: { const: "simple" },
                  section: { type: ["string", "null"] },
                  file: { type: ["string", "null"] },
                  path: { type: ["string", "null"] },
                },
                required: ["type"],
                additionalProperties: true, // FIXME: ideally when "simple" no other properties
              },
            },
            {
              if: {
                properties: {
                  type: { const: "pages" },
                },
              },
              then: {
                type: "object",
                properties: {
                  type: { const: "pages" },
                  section: { type: ["string", "null"] },
                  file: { type: ["string", "null"] },
                  path: { type: ["string", "null"] },
                },
                required: ["type", "section"],
                additionalProperties: false,
              },
            },
            {
              if: {
                properties: {
                  type: { const: "documents" },
                },
              },
              then: {
                type: "object",
                properties: {
                  type: { const: "documents" },
                  section: { type: ["string", "null"] },
                  file: { type: ["string", "null"] },
                  path: { type: ["string", "null"] },
                },
                required: ["type", "section", "file", "path"],
                additionalProperties: false,
              },
            },
            {
              // FIXME: I have no idea what this does
              if: {
                properties: {
                  type: { const: "datafiles" },
                },
              },
              then: {
                type: "object",
                properties: {
                  type: { const: "datafiles" },
                },
                required: ["type"],
                additionalProperties: false,
              },
            },
          ],
          required: ["type"],
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
  required: baseRequired,
};
export const GalleryField = {
  $id: "#galleryField",
  label: "Gallery Field",
  description:
    "A list input that adds assets to the Media Library. Good for galleries and components that require multiple files. ",
  type: "object",
  properties: {
    type: {
      const: "image_gallery",
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
        required: { type: "boolean" },
        maxSize: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
  required: baseRequired,
};
export const BlocksField = {
  $id: "#blocksField",
  label: "Blocks",
  description:
    "A list of unlike Field Groups. Great for allowing a series of different page sections be assembled in a custom way.",
  type: "object",
  properties: {
    type: {
      const: "blocks",
    },
    ...base,
    template_types: {
      type: "array",
      items: {
        type: "string",
      },
    },
    config: {
      type: "object",
      properties: {
        min: { type: ["number", "null"] },
        max: { type: ["number", "null"] },
      },
      additionalProperties: false,
    },
    fields: {
      $ref: "#/definitions/allFields",
    },
  },
  additionalProperties: false,
  required: baseRequired,
};
export const FieldGroupField = {
  $id: "#fieldGroupField",
  label: "Field Group",
  description:
    "A set of fields combined into one field. Good for objects that come in sets (e.g. a site's footer).",
  type: "object",
  properties: {
    type: {
      const: "field_group",
    },
    ...base,
    config: {
      type: "object",
      properties: {
        required: { type: "boolean" },
      },
      additionalProperties: false,
    },
    fields: {
      $ref: "#/definitions/allFields",
    },
  },
  additionalProperties: false,
  required: [...baseRequired, "fields"],
};
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
        labelField: { type: ["string", "null"] },
        min: { type: ["number", "null"] },
        max: { type: ["number", "null"] },
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

export const ForestryFMTSchema = {
  title: "Forestry FMT Schema",
  type: "object",
  description: "",
  definitions: {
    textField: TextField,
    numberField: NumberField,
    colorField: ColorField,
    tagField: TagField,
    booleanField: BooleanField,
    textAreaField: TextAreaField,
    dateField: DateField,
    includeField: IncludeField,
    blocksField: BlocksField,
    selectField: SelectField,
    fieldGroupField: FieldGroupField,
    fieldGroupListField: FieldGroupListField,
    imageField: ImageField,
    galleryField: GalleryField,
    listField: ListField,
    allFields: {
      $id: "#allFields",
      type: "array",
      title: "Field List",
      description: "List of fields for your FMT",
      items: {
        type: "object",
        required: ["type"],
        properties: {
          type: {
            type: "string",
            enum: [
              "text",
              "textarea",
              "include",
              "datetime",
              "select",
              "file",
              "blocks",
              "color",
              "boolean",
              "tag_list",
              "number",
              "image_gallery",
              "list",
              "field_group",
              "field_group_list",
            ],
          },
        },
        allOf: [
          {
            if: {
              properties: {
                type: { const: "text" },
              },
            },
            then: {
              $ref: "#/definitions/textField",
            },
          },
          {
            if: {
              properties: {
                type: { const: "blocks" },
              },
            },
            then: {
              $ref: "#/definitions/blocksField",
            },
          },
          {
            if: {
              properties: {
                type: { const: "number" },
              },
            },
            then: {
              $ref: "#/definitions/numberField",
            },
          },
          {
            if: {
              properties: {
                type: { const: "include" },
              },
            },
            then: {
              $ref: "#/definitions/includeField",
            },
          },
          {
            if: {
              properties: {
                type: { const: "color" },
              },
            },
            then: {
              $ref: "#/definitions/colorField",
            },
          },
          {
            if: {
              properties: {
                type: { const: "tag_list" },
              },
            },
            then: {
              $ref: "#/definitions/tagField",
            },
          },
          {
            if: {
              properties: {
                type: { const: "datetime" },
              },
            },
            then: {
              $ref: "#/definitions/dateField",
            },
          },
          {
            if: {
              properties: {
                type: { const: "textarea" },
              },
            },
            then: {
              $ref: "#/definitions/textAreaField",
            },
          },
          {
            if: {
              properties: {
                type: { const: "select" },
              },
            },
            then: {
              $ref: "#/definitions/selectField",
            },
          },
          {
            if: {
              properties: {
                type: { const: "file" },
              },
            },
            then: {
              $ref: "#/definitions/imageField",
            },
          },
          {
            if: {
              properties: {
                type: { const: "image_gallery" },
              },
            },
            then: {
              $ref: "#/definitions/galleryField",
            },
          },
          {
            if: {
              properties: {
                type: { const: "field_group" },
              },
            },
            then: {
              $ref: "#/definitions/fieldGroupField",
            },
          },
          {
            if: {
              properties: {
                type: { const: "field_group_list" },
              },
            },
            then: {
              $ref: "#/definitions/fieldGroupListField",
            },
          },
          {
            if: {
              properties: {
                type: { const: "list" },
              },
            },
            then: {
              $ref: "#/definitions/listField",
            },
          },
        ],
      },
    },
  },
  properties: {
    label: {
      title: "Label",
      description: "The label used in the sidebar",
      type: "string",
    },
    hide_body: {
      type: "boolean",
      title: "Hide Body?",
      description: "Whether to show the body for the markdown file.",
    },
    display_field: {
      type: "string",
    },
    fields: { $ref: "#/definitions/allFields" },
    pages: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
  required: ["label", "hide_body", "fields"],
  additionalProperties: false,
};
