import { gql } from "../../gql";

import { BuildArgs, ResolveArgs } from "../";

export const imageGallery = {
  build: {
    field: async ({ accumulator }: BuildArgs<ImageGalleryField>) => {
      const name = "ImageGalleryField";
      accumulator.push(
        gql.object({
          name,
          fields: [
            gql.string("name"),
            gql.string("label"),
            gql.string("component"),
          ],
        })
      );

      return name;
    },
    initialValue: ({ field }: BuildArgs<ImageGalleryField>) => {
      return gql.string(field.name);
    },
    value: ({ field }: BuildArgs<ImageGalleryField>) => {
      return gql.string(field.name);
    },
    input: ({ field }: BuildArgs<ImageGalleryField>) => {
      return gql.inputString(field.name);
    },
  },
  resolve: {
    field: ({
      field,
    }: Omit<
      ResolveArgs<ImageGalleryField>,
      "value"
    >): TinaImageGalleryField => {
      const { type, ...rest } = field;
      return {
        ...rest,
        component: "text",
        config: rest.config || {
          required: false,
        },
        __typename: "ImageGalleryField",
      };
    },
    initialValue: async ({
      value,
    }: ResolveArgs<ImageGalleryField>): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected initial value of type ${typeof value} for resolved imageGallery value`
        );
      }
      return value;
    },
    value: async ({
      value,
    }: ResolveArgs<ImageGalleryField>): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected value of type ${typeof value} for resolved imageGallery value`
        );
      }
      return value;
    },
    input: async ({
      value,
    }: ResolveArgs<ImageGalleryField>): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected input value of type ${typeof value} for resolved imageGallery value`
        );
      }
      return value;
    },
  },
};

export type ImageGalleryField = {
  label: string;
  name: string;
  type: "image_gallery";
  default?: string;
  config?: {
    required?: boolean;
  };
  __namespace: string;
};

export type TinaImageGalleryField = {
  label: string;
  name: string;
  component: "text";
  default?: string;
  config?: {
    required?: boolean;
  };
  __typename: "ImageGalleryField";
};
