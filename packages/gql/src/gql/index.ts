import {
  FieldDefinitionNode,
  ScalarTypeDefinitionNode,
  InputValueDefinitionNode,
  ObjectTypeDefinitionNode,
  InterfaceTypeDefinitionNode,
  NamedTypeNode,
} from "graphql";

export const gql = {
  formField: (name: string, additionalFields?: FieldDefinitionNode[]) => {
    return gql.object({
      name: name,
      interfaces: [gql.namedType({ name: "FormField" })],
      fields: [
        gql.string("name"),
        gql.string("label"),
        gql.string("component"),
        ...(additionalFields || []),
      ],
    });
  },
  scalar: (name: string): ScalarTypeDefinitionNode => {
    return {
      kind: "ScalarTypeDefinition",
      name: {
        kind: "Name",
        value: name,
      },
      directives: [],
    };
  },
  string: (name: string) => {
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
  },
  stringList: (name: string) => ({
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
  }),
  inputID: (name: string): InputValueDefinitionNode => ({
    kind: "InputValueDefinition" as const,
    name: {
      kind: "Name" as const,
      value: name,
    },
    type: {
      kind: "NonNullType",
      type: {
        kind: "NamedType" as const,
        name: {
          kind: "Name" as const,
          value: "ID",
        },
      },
    },
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
  inputBoolean: (name: string) => ({
    kind: "InputValueDefinition" as const,
    name: {
      kind: "Name" as const,
      value: name,
    },
    type: {
      kind: "NamedType" as const,
      name: {
        kind: "Name" as const,
        value: "Boolean",
      },
    },
  }),
  inputInt: (name: string) => ({
    kind: "InputValueDefinition" as const,
    name: {
      kind: "Name" as const,
      value: name,
    },
    type: {
      kind: "NamedType" as const,
      name: {
        kind: "Name" as const,
        value: "Int",
      },
    },
  }),
  inputValue: (name: string, type: string) => {
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
          value: type,
        },
      },
    };
  },
  inputValueList: (name: string, type: string) => {
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
            value: type,
          },
        },
      },
    };
  },
  fieldID: ({ name }: { name: string }) => ({
    kind: "FieldDefinition" as const,
    name: {
      kind: "Name" as const,
      value: name,
    },
    type: {
      kind: "NonNullType" as const,
      type: {
        kind: "NamedType" as const,
        name: {
          kind: "Name" as const,
          value: "ID",
        },
      },
    },
  }),
  field: ({
    name,
    type,
    args = [],
  }: {
    name: string;
    type: string;
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
          value: type,
        },
      },
      arguments: args,
    };
  },
  fieldRequired: ({
    name,
    type,
    args = [],
  }: {
    name: string;
    type: string;
    args?: InputValueDefinitionNode[];
  }): FieldDefinitionNode => {
    return {
      kind: "FieldDefinition" as const,
      name: {
        kind: "Name" as const,
        value: name,
      },
      type: {
        kind: "NonNullType",
        type: {
          kind: "NamedType" as const,
          name: {
            kind: "Name" as const,
            value: type,
          },
        },
      },
      arguments: args,
    };
  },
  interface: ({
    name,
    fields,
  }: {
    name: string;
    fields: FieldDefinitionNode[];
  }): InterfaceTypeDefinitionNode => {
    return {
      kind: "InterfaceTypeDefinition",
      name: {
        kind: "Name",
        value: name,
      },
      interfaces: [],
      directives: [],
      fields: fields,
    };
  },
  fieldList: ({
    name,
    type,
    args = [],
  }: {
    name: string;
    type: string;
    args?: InputValueDefinitionNode[];
  }): FieldDefinitionNode => {
    return {
      kind: "FieldDefinition" as const,
      arguments: args,
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
            value: type,
          },
        },
      },
    };
  },
  input: ({
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
  node: ({
    name,
    fields,
    args = [],
  }: {
    name: string;
    fields: FieldDefinitionNode[];
    args?: InputValueDefinitionNode[];
  }): ObjectTypeDefinitionNode => ({
    kind: "ObjectTypeDefinition" as const,
    arguments: args,
    interfaces: [
      {
        kind: "NamedType",
        name: {
          kind: "Name",
          value: "Node",
        },
      },
    ],
    name: {
      kind: "Name" as const,
      value: name,
    },
    fields,
  }),
  namedType: ({ name }: { name: string }): NamedTypeNode => {
    return {
      kind: "NamedType",
      name: {
        kind: "Name",
        value: name,
      },
    };
  },
  object: ({
    name,
    fields,
    interfaces = [],
    args = [],
  }: {
    name: string;
    fields: FieldDefinitionNode[];
    interfaces?: NamedTypeNode[];
    args?: NamedTypeNode[];
  }): ObjectTypeDefinitionNode => ({
    kind: "ObjectTypeDefinition" as const,
    arguments: args,
    interfaces,
    name: {
      kind: "Name" as const,
      value: name,
    },
    fields,
  }),
};
