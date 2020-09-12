export type FieldGroupField = {
  label: string;
  name: string;
  type: "field-group";
  default: string;
  fields: any[];
  config?: {
    required?: boolean;
  };
};

const getter = ({
  value,
  field,
  datasource,
}: {
  value: { [key: string]: any }[];
  field: FieldGroupField;
  datasource: any;
}) => {
  const fields: { [key: string]: any } = {};
  field.fields.forEach((field: any) => (fields[field.name] = field));
  return {
    _fields: fields,
    ...value,
  };
};

export const fieldGroup = {
  getter,
};
