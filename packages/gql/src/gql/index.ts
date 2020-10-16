import { GraphQLString, FieldDefinitionNode } from "graphql";

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
  object: ({
    name,
    fields,
  }: {
    name: string;
    fields: FieldDefinitionNode[];
  }) => ({
    kind: "ObjectTypeDefinition" as const,
    name: {
      kind: "Name" as const,
      value: name,
    },
    fields,
  }),
  inputString: (name: string) => ({
    kind: "InputValueDefinition" as const,
    name: {
      kind: "Name" as const,
      value: name,
    },
    type: {
      kind: "NamedType" as const,
      name: {
        kind: "Name" as const,
        value: "String",
      },
    },
  }),
};
