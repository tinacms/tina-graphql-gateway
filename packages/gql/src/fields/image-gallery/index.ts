import { gql } from "../../gql";

import { BuildArgs, ResolveArgs, assertIsStringArray } from "../";
import { list, TinaListField } from "../list";

export const imageGallery = {
  build: {
    field: async ({
      cache,
      field,
      accumulator,
    }: BuildArgs<ImageGalleryField>) => {
      return list.build.field({
        cache,
        field: list.imageGalleryField(field),
        accumulator,
      });
    },
    initialValue: ({ field }: BuildArgs<ImageGalleryField>) => {
      return gql.stringList(field.name);
    },
    value: ({ field }: BuildArgs<ImageGalleryField>) => {
      return gql.stringList(field.name);
    },
    input: ({ field }: BuildArgs<ImageGalleryField>) => {
      return gql.inputValueList(field.name, "String");
    },
  },
  resolve: {
    field: async ({
      datasource,
      field,
    }: Omit<ResolveArgs<ImageGalleryField>, "value">): Promise<
      TinaImageGalleryField
    > => {
      return await list.resolve.field({
        datasource,
        field: list.imageGalleryField(field),
      });
    },
    initialValue: async ({
      value,
    }: ResolveArgs<ImageGalleryField>): Promise<string[]> => {
      assertIsStringArray(value, { source: "image gallery initial value" });
      return value;
    },
    value: async ({
      value,
    }: ResolveArgs<ImageGalleryField>): Promise<string[]> => {
      assertIsStringArray(value, { source: "image gallery value" });
      return value;
    },
    input: async ({
      field,
      value,
    }: ResolveArgs<ImageGalleryField>): Promise<
      { [key: string]: string[] } | false
    > => {
      try {
        assertIsStringArray(value, { source: "image gallery input" });

        return { [field.name]: value };
      } catch (e) {
        return false;
      }
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

export type TinaImageGalleryField = TinaListField;
