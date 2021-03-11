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
  TYPES: {
    String: "String",
    Reference: "Reference",
    Section: "Section",
    ID: "ID",
    SectionParams: "SectionParams",
    Boolean: "Boolean",
    Number: "Int",
    Document: "Document",
  },
  formField: (name: string, additionalFields?: FieldDefinitionNode[]) => {
    return gql.ObjectTypeDefinition({
      name: name,
      interfaces: [gql.NamedType({ name: "FormField" })],
      fields: [
        gql.FieldDefinition({ name: "name", type: gql.TYPES.String }),
        gql.FieldDefinition({ name: "label", type: gql.TYPES.String }),
        gql.FieldDefinition({ name: "component", type: gql.TYPES.String }),
        ...(additionalFields || []),
      ],
    });
  },
  ScalarTypeDefinition: ({
    name,
    description,
  }: {
    name: string;
    description?: string;
  }): ScalarTypeDefinitionNode => {
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
  InputValueDefinition: ({
    name,
    type,
    list,
    required,
  }: {
    name: string;
    type: string;
    list?: boolean;
    required?: boolean;
  }) => {
    let res = {};
    const namedType = {
      kind: "NamedType" as const,
      name: {
        kind: "Name" as const,
        value: type,
      },
    };
    const def = {
      kind: "InputValueDefinition" as const,
      name: {
        kind: "Name" as const,
        value: name,
      },
    };
    if (list) {
      if (required) {
        res = {
          ...def,
          type: {
            kind: "ListType" as const,
            type: {
              kind: "NonNullType",
              type: namedType,
            },
          },
        };
      } else {
        res = {
          ...def,
          type: {
            kind: "ListType" as const,
            type: namedType,
          },
        };
      }
    } else {
      if (required) {
        res = {
          ...def,
          type: {
            kind: "NonNullType",
            type: namedType,
          },
        };
      } else {
        res = {
          ...def,
          type: namedType,
        };
      }
    }

    return res as InputValueDefinitionNode;
  },
  FieldDefinition: ({
    name,
    type,
    args = [],
    list,
    required,
  }: {
    name: string;
    type: string;
    required?: boolean;
    list?: boolean;
    args?: InputValueDefinitionNode[];
  }) => {
    let res = {};
    let namedType = {
      kind: "NamedType" as const,
      name: {
        kind: "Name" as const,
        value: type,
      },
    };
    let def = {
      kind: "FieldDefinition" as const,
      name: {
        kind: "Name" as const,
        value: name,
      },
      arguments: args,
    };
    if (list) {
      if (required) {
        res = {
          ...def,
          type: {
            kind: "ListType" as const,
            type: {
              kind: "NonNullType",
              type: namedType,
            },
          },
        };
      } else {
        res = {
          ...def,
          type: {
            kind: "ListType" as const,
            type: namedType,
          },
        };
      }
    } else {
      if (required) {
        res = {
          ...def,
          type: {
            kind: "NonNullType" as const,
            type: namedType,
          },
        };
      } else {
        res = {
          ...def,
          type: namedType,
        };
      }
    }

    return res as FieldDefinitionNode;
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
