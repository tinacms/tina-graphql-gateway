import { base, baseRequired } from "../common";

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
      minItems: 1,
      // removeIfFails: true,
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
