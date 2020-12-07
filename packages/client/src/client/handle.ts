// @ts-ignore
import { friendlyName, templateName } from "@forestryio/graphql-helpers";
import type { Field } from "tinacms";

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
        acc[friendlyName(template, "", true)] = {
          // template: templateName(v._template),
          ...handleData(v, template),
        };

        return acc;
      });

    case "group":
      // FIXME: this shouldn't be sent down for anything other than blocks
      const { _template, ...rest } = value;

      return rest;
    case "group-list":
      // FIXME: this shouldn't be sent down for anything other than blocks
      console.log("gl", value);
      // const { _template, ...rest } = value;
      return value.map((item) => {
        const { _template: __template, ...rest } = item;
        return rest;
      });

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

export const transformPayload = (values, schema: { fields: Field[] }) => {
  try {
    const accum: { [key: string]: any } = {};
    schema.fields.forEach((field) => {
      // @ts-ignore
      accum[field.name] = handleInner(values, field);
    });

    // @ts-ignore
    return { [friendlyName(schema, "", true)]: accum };
  } catch (e) {
    console.error("Error transformaing payload");
    console.log(e);
  }
};
