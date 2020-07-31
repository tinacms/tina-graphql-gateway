import { FieldData, GeneratedFieldsType } from "./fields/types";

import { FieldType } from "./datasources/datasource";
import { getFieldType } from "./fields";

export type GenerateFieldAccessorsType = {
  fmt: string;
  fields: FieldType[];
  config: { rootPath: string; siteLookup: string };
  fieldData: FieldData;
};

export type GenerateFieldAccessorsFunction = (
  args: GenerateFieldAccessorsType
) => GeneratedFieldsType;

export const generateFieldAccessors = ({
  fmt,
  fields,
  config,
  fieldData,
}: GenerateFieldAccessorsType): GeneratedFieldsType => {
  const accumulator: GeneratedFieldsType = {
    getters: {},
    setters: {},
    mutators: {},
  };

  fields.forEach((field) => {
    const { getter, setter, mutator } = getFieldType({
      fmt,
      field,
      config,
      fieldData,
      generateFieldAccessors,
    });

    accumulator.getters[field.name] = getter;
    accumulator.setters[field.name] = setter;
    accumulator.mutators[field.name] = mutator;
  });

  return {
    getters: accumulator.getters,
    setters: accumulator.setters,
    mutators: accumulator.mutators,
  };
};
