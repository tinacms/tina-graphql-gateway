// @ts-ignore
import { friendlyName, templateName } from "@forestryio/graphql-helpers";
import type { Field } from "tinacms";
import {
  GraphQLSchema,
  getNamedType,
  GraphQLInputObjectType,
  isScalarType,
  GraphQLList,
  parse,
} from "graphql";

const transformInputObject = (
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
  mutation: string,
  values: object,
  schema: GraphQLSchema
) => {
  const accum = {};
  // @ts-ignore FIXME: this is assuming we're passing in a valid mutation with the top-level
  // selection being the mutation
  const mutationName = parse(mutation).definitions[0].selectionSet.selections[0]
    .name.value;
  const mutationType = schema.getMutationType();
  const inputType = mutationType
    .getFields()
    [mutationName].args.find((arg) => arg.name === "params").type;

  if (inputType instanceof GraphQLInputObjectType) {
    return transformInputObject(values, accum, inputType);
  } else {
    throw new Error(
      `Unable to transform payload, expected param arg to by an instance of GraphQLInputObjectType`
    );
  }
};
