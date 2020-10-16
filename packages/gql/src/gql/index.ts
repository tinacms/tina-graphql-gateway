import {
  GraphQLString,
  FieldDefinitionNode,
  InputValueDefinitionNode,
} from "graphql";

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
  input: (name: string, value: string) => {
    return {
      kind: "InputValueDefinition" as const,
      name: {
        kind: "Name" as const,
        value: name,
      },
      type: {
        kind: "NamedType" as const,
        name: {
          kind: "Name" as const,
          value: value,
        },
      },
    };
  },
  listInputValue: ({ name, value }: { name: string; value: string }) => {
    return {
      kind: "InputValueDefinition" as const,
      name: {
        kind: "Name" as const,
        value: name,
      },
      type: {
        kind: "ListType" as const,
        type: {
          kind: "NamedType" as const,
          name: {
            kind: "Name" as const,
            value: value,
          },
        },
      },
    };
  },
  listField: ({ name, value }: { name: string; value: string }) => {
    return {
      kind: "FieldDefinition" as const,
      name: {
        kind: "Name" as const,
        value: name,
      },
      type: {
        kind: "ListType" as const,
        type: {
          kind: "NamedType" as const,
          name: {
            kind: "Name" as const,
            value: value,
          },
        },
      },
    };
  },
  inputObject: ({
    name,
    fields,
  }: {
    name: string;
    fields: InputValueDefinitionNode[];
  }) => ({
    kind: "InputObjectTypeDefinition" as const,
    name: {
      kind: "Name" as const,
      value: name,
    },
    fields,
  }),
  union: ({ name, types }: { name: string; types: string[] }) => ({
    kind: "UnionTypeDefinition" as const,
    name: {
      kind: "Name" as const,
      value: name,
    },
    directives: [],
    types: types.map((name) => ({
      kind: "NamedType" as const,
      name: {
        kind: "Name" as const,
        value: name,
      },
    })),
  }),
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
  field: ({
    name,
    value,
    args = [],
  }: {
    name: string;
    value: string;
    args?: InputValueDefinitionNode[];
  }) => {
    return {
      kind: "FieldDefinition" as const,
      name: {
        kind: "Name" as const,
        value: name,
      },
      type: {
        kind: "NamedType" as const,
        name: {
          kind: "Name" as const,
          value: value,
        },
      },
      arguments: args,
    };
  },
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
