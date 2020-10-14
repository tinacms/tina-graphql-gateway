import { GraphQLString, GraphQLObjectType } from "graphql";
import { gql } from "../../gql";

import type { Cache } from "../../cache";
import type { DataSource } from "../../datasources/datasource";
import type { Definitions } from "../../builder/ast-builder";

export const imageGallery = {
  build: {
    field: async ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: ImageGalleryField;
      accumulator: Definitions[];
    }) => {
      accumulator.push({
        kind: "ObjectTypeDefinition",
        name: {
          kind: "Name",
          value: "ImageGalleryField",
        },
        interfaces: [],
        directives: [],
        fields: [
          gql.string("name"),
          gql.string("label"),
          gql.string("component"),
        ],
      });

      return "ImageGalleryField";
    },
    initialValue: ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: ImageGalleryField;
      accumulator: Definitions[];
    }) => {
      return gql.string(field.name);
    },
    value: ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: ImageGalleryField;
      accumulator: Definitions[];
    }) => {
      return gql.string(field.name);
    },
    input: ({
      cache,
      field,
      accumulator,
    }: {
      cache: Cache;
      field: ImageGalleryField;
      accumulator: Definitions[];
    }) => {
      return gql.inputString(field.name);
    },
  },
  resolve: {
    field: ({
      datasource,
      field,
    }: {
      datasource: DataSource;
      field: ImageGalleryField;
    }): TinaImageGalleryField => {
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
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: ImageGalleryField;
      value: unknown;
    }): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected initial value of type ${typeof value} for resolved imageGallery value`
        );
      }
      return value;
    },
    value: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: ImageGalleryField;
      value: unknown;
    }): Promise<string> => {
      if (typeof value !== "string") {
        throw new Error(
          `Unexpected value of type ${typeof value} for resolved imageGallery value`
        );
      }
      return value;
    },
    input: async ({
      datasource,
      field,
      value,
    }: {
      datasource: DataSource;
      field: ImageGalleryField;
      value: unknown;
    }): Promise<string> => {
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
