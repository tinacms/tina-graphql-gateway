import { GraphQLString } from "graphql";

export const gql = {
  string: (name: string, options: { list?: boolean } = {}) => {
    if (options.list) {
      return {
        kind: "FieldDefinition" as const,
        name: {
          kind: "Name" as const,
          value: name,
        },
        arguments: [],
        type: {
          kind: "ListType" as const,
          type: {
            kind: "NamedType" as const,
            name: {
              kind: "Name" as const,
              value: "String",
            },
          },
        },
        directives: [],
      };
    } else {
      return {
        kind: "FieldDefinition" as const,
        name: {
          kind: "Name" as const,
          value: name,
        },
        arguments: [],
        type: {
          kind: "NamedType" as const,
          name: {
            kind: "Name" as const,
            value: "String" as const,
          },
        },
        directives: [],
      };
    }
  },
  list: (item) => {
    return {
      kind: "FieldDefinition",
      name: {
        kind: "Name",
        value: field.name,
      },
      arguments: [],
      type: {
        kind: "ListType",
        type: {
          kind: "NamedType",
          name: {
            kind: "Name",
            value: "String",
          },
        },
      },
      directives: [],
    };
  },
};
