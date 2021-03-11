/**
Copyright 2021 Forestry.io Inc
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {
  FieldDefinitionNode,
  ScalarTypeDefinitionNode,
  InputValueDefinitionNode,
  ObjectTypeDefinitionNode,
  InterfaceTypeDefinitionNode,
  NamedTypeNode,
  UnionTypeDefinitionNode,
} from "graphql";

export const gql = {
  formField: (name: string, additionalFields?: FieldDefinitionNode[]) => {
    return gql.ObjectTypeDefinition({
      name: name,
      interfaces: [gql.NamedType({ name: "FormField" })],
      fields: [
        gql.string("name"),
        gql.string("label"),
        gql.string("component"),
        ...(additionalFields || []),
      ],
    });
  },
  ScalarTypeDefinition: (
    name: string,
    description?: string
  ): ScalarTypeDefinitionNode => {
    return {
      kind: "ScalarTypeDefinition",
      name: {
        kind: "Name",
        value: name,
      },
      description: {
        kind: "StringValue",
        value: description || "",
      },
      directives: [],
    };
  },
  reference: (name: string) => {
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
          value: "Reference" as const,
        },
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
  number: (name: string) => {
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
          value: "Int",
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
  inputNumber: (name: string) => ({
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
  InputValueDefinition: (name: string, type: string) => {
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
  FieldDefinition: ({
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
  InterfaceTypeDefinition: ({
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
  InputObjectTypeDefinition: ({
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
  UnionTypeDefinition: ({
    name,
    types,
  }: {
    name: string;
    types: string[];
  }): UnionTypeDefinitionNode => ({
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
  NamedType: ({ name }: { name: string }): NamedTypeNode => {
    return {
      kind: "NamedType",
      name: {
        kind: "Name",
        value: name,
      },
    };
  },
  ObjectTypeDefinition: ({
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
    interfaces,
    name: {
      kind: "Name" as const,
      value: name,
    },
    fields,
  }),
};
