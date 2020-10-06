import { TextField, TinaTextField } from "./text";
import { ListField, TinaListField } from "./list";
import { SelectField, TinaSelectField } from "./select";
import { BlocksField, TinaBlocksField } from "./blocks";
import { TextareaField, TinaTextareaField } from "./textarea";
import { FieldGroupField, TinaFieldGroupField } from "./field-group";
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
  | ListField;

export type TinaField =
  | TinaTextField
  | TinaTextareaField
  | TinaSelectField
  | TinaBlocksField
  | TinaFieldGroupField
  | TinaFieldGroupListField
  | TinaListField;
