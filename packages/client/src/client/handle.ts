// @ts-ignore
import { friendlyName, templateName } from "@forestryio/graphql-helpers";
import type { Field } from "tinacms";
import {
  GraphQLSchema,
  getNamedType,
  GraphQLInputObjectType,
  isScalarType,
  GraphQLList,
} from "graphql";

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
      const { _template, ...rest } = value;

      return rest;
    case "group-list":
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

const doit = (
  values: object,
  accum: { [key: string]: unknown },
  payloadType: GraphQLInputObjectType
) => {
  const fields = payloadType.getFields();
  const templateNameString = friendlyName(values["_template"], "", true);
  const templateField = fields[templateNameString];

  // Field Groups don't have a _template field
  if (!templateField) {
    return values;
  }

  const templateType = getNamedType(templateField.type);
  if (templateType instanceof GraphQLInputObjectType) {
    const fieldTypes = {};
    Object.values(templateType.getFields()).map((field) => {
      const fieldType = getNamedType(field.type);

      const valueForField = values[field.name];
      if (isScalarType(fieldType)) {
        fieldTypes[field.name] = valueForField;
      } else {
        if (field.type instanceof GraphQLList) {
          fieldTypes[field.name] = (valueForField || []).map((val) => {
            if (fieldType instanceof GraphQLInputObjectType) {
              return doit(val, {}, fieldType);
            } else {
              throw new Error(
                `Expected instance of GraphQLInputObjectType but got ${fieldType}`
              );
            }
          });
        } else {
          // Field Groups don't have a _template field
          fieldTypes[field.name] = valueForField;
        }
      }
    });
    accum[templateNameString] = fieldTypes;
  }
  return accum;
};

export const transformPayload = (
  values,
  form: { fields: Field[] },
  schema: GraphQLSchema
) => {
  const accum = {};
  const payloadType = schema.getType("Pages_Input");
  if (payloadType instanceof GraphQLInputObjectType) {
    return doit(values, accum, payloadType);
  }
};
