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
  field?: SelectField;
  datasource: any;
}) => {
  const args = { path: value };
  const template = datasource.getTemplateForDocument(args);

  return {
    ...datasource.getData(args),
    _template: template.label,
    _fields: {
      data: { type: "field-group", fields: template.fields },
      content: { type: "textarea", name: "content", label: "Content" },
    },
  };
};

export const select = {
  getter,
};
