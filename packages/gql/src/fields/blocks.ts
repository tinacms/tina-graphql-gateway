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
  value: { [key: string]: any }[];
  field: SelectField;
  datasource: any;
}) => {
  const description = {
    type: "textarea" as const,
    label: "Description",
    name: "description",
  };
  return value.map((value) => {
    return {
      _fields: { description },
      ...value,
    };
  });
};

export const blocks = {
  getter,
};
