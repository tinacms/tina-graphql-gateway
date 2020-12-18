// @ts-ignore
import { friendlyName } from "@forestryio/graphql-helpers";
import {
  GraphQLSchema,
  getNamedType,
  GraphQLInputObjectType,
  isScalarType,
  GraphQLList,
  parse,
} from "graphql";

export const transformPayload = ({
  mutation,
  values,
  schema,
}: {
  mutation: string;
  values: object;
  schema: GraphQLSchema;
}) => {
  try {
    const accum = {};
    // FIXME: this is assuming we're passing in a valid mutation with the top-level
    // selection being the mutation
    // @ts-ignore
    const mutationName = parse(mutation).definitions[0].selectionSet
      .selections[0].name.value;
    const mutationType = schema.getMutationType();

    if (!mutationType) {
      throw new Error(`Expected to find mutation type in schema`);
    }

    const mutationNameType = mutationType.getFields()[mutationName];

    if (!mutationNameType) {
      throw new Error(`Expected to find mutation type ${mutationNameType}`);
    }

    const inputType = mutationNameType.args.find((arg) => arg.name === "params")
      .type;

    if (inputType instanceof GraphQLInputObjectType) {
      return transformInputObject(values, accum, inputType);
    } else {
      throw new Error(
        `Unable to transform payload, expected param arg to by an instance of GraphQLInputObjectType`
      );
    }
  } catch (e) {
    console.log("oh no", e);
  }
};

const transformInputObject = (
  values: object,
  accum: { [key: string]: unknown },
  payloadType: GraphQLInputObjectType
) => {
  const fields = payloadType.getFields();
  const templateNameString = friendlyName(values["_template"], {
    lowerCase: true,
  });
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
              return transformInputObject(val, {}, fieldType);
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
