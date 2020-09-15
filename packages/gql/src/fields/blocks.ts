import type { Field } from "./index";
import type { DataSource } from "../datasources/datasource";

export type BlocksField = {
  label: string;
  name: string;
  type: "blocks";
  default: string;
  template_types: string[];
  config?: {
    required?: boolean;
  };
};

type FieldMap = { [key: string]: Field };
const getter = async ({
  value,
  field,
  datasource,
}: {
  value: { template: string; [key: string]: unknown }[];
  field: BlocksField;
  datasource: DataSource;
}): Promise<{ _fields: FieldMap; [key: string]: unknown }[]> => {
  return Promise.all(
    value.map(async (value) => {
      const template = await datasource.getTemplate({ slug: value.template });
      const fields: { [key: string]: Field } = {};
      template.fields.forEach((field) => (fields[field.name] = field));

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
