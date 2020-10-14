import { TextField, TinaTextField } from "./text";
import { ListField, TinaListField } from "./list";
import { SelectField, TinaSelectField } from "./select";
import { BlocksField, TinaBlocksField } from "./blocks";
import { TextareaField, TinaTextareaField } from "./textarea";
import { FieldGroupField, TinaFieldGroupField } from "./field-group";
import { BooleanField, TinaBooleanField } from "./boolean";
import { DatetimeField, TinaDatetimeField } from "./datetime";
import { FileField, TinaFileField } from "./file";
import { ImageGalleryField, TinaImageGalleryField } from "./image-gallery";
import { NumberField, TinaNumberField } from "./number";
import { TagListField, TinaTagListField } from "./tag-list";
import {
  FieldGroupListField,
  TinaFieldGroupListField,
} from "./field-group-list";

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
