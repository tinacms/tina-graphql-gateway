import {
  friendlyFMTName,
  friendlyName,
  queryBuilder,
} from "@forestryio/graphql-helpers";
import { getIntrospectionQuery, buildClientSchema, print } from "graphql";
import type { Field, BlockTemplate } from "tinacms";

type BlockItem = {
  label: string;
  _template: string;
} & object;

type BlockField = {
  templates: BlockItem[];
};

const handleInner = (values, field: Field & { fields: Field[] }) => {
  const value = values[field.name];
  if (!value) {
    return;
  }

  switch (field.component) {
    case "text":
      return value;
    case "blocks":
      const blockField = field;

      return value.map((v) => {
        const acc: { [key: string]: any } = {};
        // @ts-ignore
        const template = blockField.templates[v._template];
        if (!template) {
          throw new Error(`Unable to find template in field ${field.name}`);
        }
        acc[friendlyName(template, "InputData")] = {
          template: v._template,
          ...handleData(v, template),
        };

        return acc;
      });
    // Return an array of one value, tagged union pattern

    case "group":
      // FIXME: this shouldn't be sent down for anything other than blocks
      const { _template, ...rest } = value;

      return rest;

    default:
      return value;
  }
};

export const handleData = (values, schema: { fields: Field[] }) => {
  const accum: { [key: string]: any } = {};
  schema.fields.forEach((field) => {
    // @ts-ignore
    accum[field.name] = handleInner(values, field);
  });

  return accum;
};

export const handle = (values, schema: { fields: Field[] }) => {
  const accum: { [key: string]: any } = {};
  schema.fields.forEach((field) => {
    // @ts-ignore
    accum[field.name] = handleInner(values, field);
  });

  // @ts-ignore
  return { [friendlyName(schema, "Input")]: { data: accum } };
};
