export type SelectField = {
  label: string;
  name: string;
  type: "select";
  default: string;
  config?: {
    required?: boolean;
  };
};

const getter = ({
  value,
  field,
  datasource,
}: {
  value: string;
  field: SelectField;
  datasource: any;
}) => {
  return datasource.getData({ path: value });
};

export const select = {
  getter,
};
