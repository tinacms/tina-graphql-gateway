import { TextField } from "./text";
import { TextareaField } from "./textarea";
import { SelectField } from "./select";
import { BlocksField } from "./blocks";
import { FieldGroupField } from "./field-group";

export type Field =
  | TextField
  | TextareaField
  | SelectField
  | BlocksField
  | FieldGroupField;
