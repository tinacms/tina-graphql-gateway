import {
  GraphQLString,
  FieldDefinitionNode,
  InputValueDefinitionNode,
} from "graphql";
import { argsToArgsConfig } from "graphql/type/definition";

export const gql = {
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
  object: ({
    name,
    fields,
    args = [],
  }: {
    name: string;
    fields: FieldDefinitionNode[];
    args?: InputValueDefinitionNode[];
  }) => ({
    kind: "ObjectTypeDefinition" as const,
    arguments: args,
    name: {
      kind: "Name" as const,
      value: name,
    },
    fields,
  }),
};
