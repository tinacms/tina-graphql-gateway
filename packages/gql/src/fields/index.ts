import { TextField, TinaTextField } from "./text";
import { TextareaField, TinaTextareaField } from "./textarea";
import { SelectField, TinaSelectField } from "./select";
import { BlocksField, TinaBlocksField } from "./blocks";
import { FieldGroupField, TinaFieldGroupField } from "./field-group";
import {
  FieldGroupListField,
  TinaFieldGroupListField,
} from "./field-group-list";
import { ListField, TinaListField } from "./list";

export type Field =
  | TextField
  | TextareaField
  | SelectField
  | BlocksField
  | FieldGroupField
  | FieldGroupListField
  | ListField;

export type TinaField =
  | TinaTextField
  | TinaTextareaField
  | TinaSelectField
  | TinaBlocksField
  | TinaFieldGroupField
  | TinaFieldGroupListField
  | TinaListField;
