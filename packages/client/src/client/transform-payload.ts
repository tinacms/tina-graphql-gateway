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
  sys,
}: {
  mutation: string;
  values: object;
  schema: GraphQLSchema;
  sys: {
    template: string;
    section: {
      slug: string;
    };
  };
}) => {
  try {
    const accum = {};
    // FIXME: this is assuming we're passing in a valid mutation with the top-level
    // selection being the mutation
    const parsedMutation = parse(mutation);
    const mutationName =
      // @ts-ignore
      parsedMutation.definitions[0].selectionSet.selections[0].name.value;
    const mutationType = schema.getMutationType();

    if (!mutationType) {
      throw new Error(`Expected to find mutation type in schema`);
    }

    const mutationNameType = mutationType.getFields()[mutationName];

    if (!mutationNameType) {
      throw new Error(`Expected to find mutation type ${mutationNameType}`);
    }

    const paramsArg = mutationNameType.args.find(
      (arg) => arg.name === "params"
    );
    const inputType = paramsArg.type;

    if (inputType instanceof GraphQLInputObjectType) {
      const transformedInput = transformInputObject(values, accum, inputType);
      // SectionParams is special because we need to include the seciton
      // and template as the 2 highest keys in the payload
      if (inputType.name === "SectionParams") {
        const section = Object.values(inputType.getFields()).find((field) => {
          return field.name === sys.section.slug;
        });
        if (section.type instanceof GraphQLInputObjectType) {
          const template = Object.values(section.type.getFields()).find(
            (field) => field.name === sys.template
          );
          const payload = {
            [section.name]: {
              [template.name]: transformedInput,
            },
          };

          return payload;
        }
      }
      return transformedInput;
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
  const template = values["_template"];
  // No template for field-group and field-group-list
  // so just return the value as-is
  if (!template) {
    return values;
  }

  const templateNameString = friendlyName(template, {
    lowerCase: true,
  });
  const templateField = fields[templateNameString];

  // FIXME: redundant? Looks like it's handled above
  // Field Groups don't have a _template field
  if (!templateField) {
    // FIXME: sometimes we're sending _template when it's not needed
    // matched by the fields we're supposed to have
    // @ts-ignore
    const { _template, ...rest } = values;
    return rest;
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
