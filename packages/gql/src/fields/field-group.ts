import type { Field } from "./index";
import type { DataSource } from "../datasources/datasource";

export type FieldGroupField = {
  label: string;
  name: string;
  type: "field-group";
  default: string;
  fields: Field[];
  config?: {
    required?: boolean;
  };
};

type FieldMap = { [key: string]: Field };
const getter = ({
  value,
  field,
  datasource,
}: {
  value: { [key: string]: any }[];
  field: FieldGroupField;
  datasource: DataSource;
}): { _fields: FieldMap; [key: string]: unknown } => {
  const fields: FieldMap = {};
  field.fields.forEach((field) => (fields[field.name] = field));

  return {
    _fields: fields,
    ...value,
  };
};

export const fieldGroup = {
  getter,
};
