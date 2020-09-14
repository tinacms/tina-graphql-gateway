export type SelectField = {
  label: string;
  name: string;
  type: "select";
  default: string;
  config?: {
    required?: boolean;
  };
};

const getter = async ({
  value,
  field,
  datasource,
}: {
  value: { [key: string]: any }[];
  field: SelectField;
  datasource: any;
}) => {
  return Promise.all(
    value.map(async (value) => {
      const template = await datasource.getTemplate({ slug: value.template });
      const fields: { [key: string]: any } = {};
      template.fields.forEach((field: any) => (fields[field.name] = field));

      return {
        _fields: fields,
        ...value,
      };
    })
  );
};
export const blocks = {
  getter,
};
