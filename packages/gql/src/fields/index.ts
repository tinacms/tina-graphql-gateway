import * as yup from "yup";

import type { TextField, TinaTextField } from "./text";
import type { ListField, TinaListField } from "./list";
import type { SelectField, TinaSelectField } from "./select";
import type { BlocksField, TinaBlocksField } from "./blocks";
import type { TextareaField, TinaTextareaField } from "./textarea";
import type { FieldGroupField, TinaFieldGroupField } from "./field-group";
import type { BooleanField, TinaBooleanField } from "./boolean";
import type { DatetimeField, TinaDatetimeField } from "./datetime";
import type { FileField, TinaFileField } from "./file";
import type { ImageGalleryField, TinaImageGalleryField } from "./image-gallery";
import type { NumberField, TinaNumberField } from "./number";
import type { TagListField, TinaTagListField } from "./tag-list";
import type {
  FieldGroupListField,
  TinaFieldGroupListField,
} from "./field-group-list";

import type { Definitions } from "../builder";
import type { DataSource } from "../datasources/datasource";
import type { Cache } from "../cache";

export type Field =
  | TextField
  | TextareaField
  | SelectField
  | BlocksField
  | FieldGroupField
  | FieldGroupListField
  | ListField
  | DatetimeField
  | FileField
  | ImageGalleryField
  | NumberField
  | TagListField
  | BooleanField;

export type TinaField =
  | TinaTextField
  | TinaTextareaField
  | TinaSelectField
  | TinaBlocksField
  | TinaFieldGroupField
  | TinaFieldGroupListField
  | TinaDatetimeField
  | TinaFileField
  | TinaImageGalleryField
  | TinaListField
  | TinaNumberField
  | TinaTagListField
  | TinaBooleanField;

export type BuildArgs<T> = {
  cache: Cache;
  field: T;
  accumulator: Definitions[];
};

export type ResolveArgs<T> = {
  datasource: DataSource;
  field: T;
  value: unknown;
};

export function assertIsString(
  value: unknown,
  options: { source: string }
): asserts value is string {
  if (typeof value !== "string") {
    throw new Error(
      `Unexpected value of type ${typeof value} for ${options.source}`
    );
  }
}

export function assertIsStringArray(
  value: unknown,
  options: { source: string }
): asserts value is string[] {
  const schema = yup.array().of(yup.string());

  try {
    schema.validateSync(value);
  } catch (e) {
    console.log(value);
    throw new Error(
      `Unexpected array of strings for ${options.source} - ${e.message}`
    );
  }
}
