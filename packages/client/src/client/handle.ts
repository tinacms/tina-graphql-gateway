import { friendlyFMTName, queryBuilder } from "@forestryio/graphql-helpers";
import { getIntrospectionQuery, buildClientSchema, print } from "graphql";
import type { Field } from "tinacms";

type BlockItem = {
  label: string;
  _template: string;
} & object;

type BlockField = {
  templates: BlockItem[];
};

const handleInner = (values, field: Field & { fields: Field[] }) => {
  switch (field.component) {
    case "text":
      return values[field.name];
    case "blocks":
      // @ts-ignore
      const blockField = field as BlockField;
      const templates = Object.values(blockField.templates);

      console.log({ templates });
      const acc: { [key: string]: any } = {};
      values[field.name].map((v) => {
        console.log({ v });
        const template = templates.find((t) => t._template === v._template);
        if (!template) {
          throw new Error(`Unable to find template in field ${field.name}`);
        }
        // @ts-ignore
        acc[`${template.label}InputData`] = handleData(v, template);
      });
      // Return an array of one value, tagged union pattern
      return [acc];

    default:
      return values[field.name];
  }
};

export const handleData = (values, schema: { fields: Field[] }) => {
  // @ts-ignore
  const accum: { [key: string]: any } = { _template: schema._template };
  schema.fields.forEach((field) => {
    // @ts-ignore
    accum[field.name] = handleInner(values, field);
  });

  return accum;
};

export const handle = (values, schema: { fields: Field[] }) => {
  console.log(schema);
  const accum: { [key: string]: any } = {};
  schema.fields.forEach((field) => {
    // @ts-ignore
    accum[field.name] = handleInner(values, field);
  });

  return { [`${values._template}Input`]: { data: accum } };
};
