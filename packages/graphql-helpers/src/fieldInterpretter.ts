import {

  GraphQLNamedType,
  DocumentNode,
  getNamedType,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLArgument,
} from "graphql";

interface FieldInterpretterProps {
  mutationName: string
  fieldName: string
  docAst: any
  paramInputType: GraphQLArgument
}

abstract class FieldInterpretter {
  protected mutationName: string
  protected fieldName: string
  protected docAst: any
  protected paramInputType: GraphQLArgument
  constructor({mutationName, fieldName ,docAst,paramInputType}: FieldInterpretterProps) {
    this.mutationName = mutationName
    this.fieldName = fieldName
    this.docAst = docAst
    this.paramInputType = paramInputType
   }

  abstract getQuery(): DocumentNode;

  abstract getMutation(): DocumentNode;
}

export const getFieldInterpretter = (namedType: GraphQLNamedType, args: FieldInterpretterProps): FieldInterpretter | undefined => {
  if(namedType instanceof GraphQLUnionType && namedType.name === "SectionDocumentUnion") {
    return new SectionDocumentUnionInterpretter(args)
  }
  if(namedType instanceof GraphQLObjectType)
  {
    return new GraphQLObjectTypeInterpretter(args)

  }

  return
}

class SectionDocumentUnionInterpretter extends FieldInterpretter {

  getQuery(): DocumentNode {
    return {
      kind: "Document" as const,
      definitions: [
        {
          kind: "OperationDefinition" as const,
          operation: "query",
          name: {
            kind: "Name" as const,
            value: this.fieldName,
          },
          variableDefinitions: [
            {
              kind: "VariableDefinition" as const,
              variable: {
                kind: "Variable" as const,
                name: {
                  kind: "Name" as const,
                  value: "section",
                },
              },
              type: {
                kind: "NonNullType" as const,
                type: {
                  kind: "NamedType" as const,
                  name: {
                    kind: "Name" as const,
                    value: "String",
                  },
                },
              },
            },
            {
              kind: "VariableDefinition" as const,
              variable: {
                kind: "Variable" as const,
                name: {
                  kind: "Name" as const,
                  value: "relativePath",
                },
              },
              type: {
                kind: "NonNullType" as const,
                type: {
                  kind: "NamedType" as const,
                  name: {
                    kind: "Name" as const,
                    value: "String",
                  },
                },
              },
            },
          ],
          selectionSet: {
            kind: "SelectionSet",
            selections: [
              {
                kind: "Field",
                name: {
                  kind: "Name",
                  value: this.fieldName,
                },
                arguments: [
                  {
                    kind: "Argument",
                    name: {
                      kind: "Name",
                      value: "relativePath",
                    },
                    value: {
                      kind: "Variable",
                      name: {
                        kind: "Name",
                        value: "relativePath",
                      },
                    },
                  },
                ],
                directives: [],
                selectionSet: this.docAst.selectionSet,
              },
            ],
          },
        },
      ],
    }


  }

  getMutation(): DocumentNode {
    return {
      kind: "Document" as const,
      definitions: [
        {
          kind: "OperationDefinition" as const,
          operation: "mutation",
          name: {
            kind: "Name" as const,
            value: this.mutationName,
          },
          variableDefinitions: [
            {
              kind: "VariableDefinition" as const,
              variable: {
                kind: "Variable" as const,
                name: {
                  kind: "Name" as const,
                  value: "relativePath",
                },
              },
              type: {
                kind: "NonNullType" as const,
                type: {
                  kind: "NamedType" as const,
                  name: {
                    kind: "Name" as const,
                    value: "String",
                  },
                },
              },
            },
            {
              kind: "VariableDefinition" as const,
              variable: {
                kind: "Variable" as const,
                name: {
                  kind: "Name" as const,
                  value: "params",
                },
              },
              type: {
                kind: "NonNullType" as const,
                type: {
                  kind: "NamedType" as const,
                  name: {
                    kind: "Name" as const,
                    value: getNamedType(this.paramInputType?.type).name,
                  },
                },
              },
            },
          ],
          selectionSet: {
            kind: "SelectionSet",
            selections: [
              {
                kind: "Field",
                name: {
                  kind: "Name",
                  value: this.mutationName,
                },
                arguments: [
                  {
                    kind: "Argument",
                    name: {
                      kind: "Name",
                      value: "relativePath",
                    },
                    value: {
                      kind: "Variable",
                      name: {
                        kind: "Name",
                        value: "relativePath",
                      },
                    },
                  },
                  {
                    kind: "Argument",
                    name: {
                      kind: "Name",
                      value: "params",
                    },
                    value: {
                      kind: "Variable",
                      name: {
                        kind: "Name",
                        value: "params",
                      },
                    },
                  },
                ],
                directives: [],
                selectionSet: this.docAst.selectionSet,
              },
            ],
          },
        },
      ],
    }
  }
}

class GraphQLObjectTypeInterpretter extends FieldInterpretter {
  getQuery(): DocumentNode {
    return {
      kind: "Document" as const,
      definitions: [
        {
          kind: "OperationDefinition" as const,
          operation: "query",
          name: {
            kind: "Name" as const,
            value: this.fieldName,
          },
          variableDefinitions: [
            {
              kind: "VariableDefinition" as const,
              variable: {
                kind: "Variable" as const,
                name: {
                  kind: "Name" as const,
                  value: "relativePath",
                },
              },
              type: {
                kind: "NonNullType" as const,
                type: {
                  kind: "NamedType" as const,
                  name: {
                    kind: "Name" as const,
                    value: "String",
                  },
                },
              },
            },
          ],
          selectionSet: {
            kind: "SelectionSet",
            selections: [
              {
                kind: "Field",
                name: {
                  kind: "Name",
                  value: this.fieldName,
                },
                arguments: [
                  {
                    kind: "Argument",
                    name: {
                      kind: "Name",
                      value: "relativePath",
                    },
                    value: {
                      kind: "Variable",
                      name: {
                        kind: "Name",
                        value: "relativePath",
                      },
                    },
                  },
                ],
                directives: [],
                selectionSet: this.docAst.selectionSet,
              },
            ],
          },
        },
      ],
    };
  }

  getMutation(): DocumentNode {
    return {
      kind: "Document" as const,
      definitions: [
        {
          kind: "OperationDefinition" as const,
          operation: "mutation",
          name: {
            kind: "Name" as const,
            value: this.mutationName,
          },
          variableDefinitions: [
            {
              kind: "VariableDefinition" as const,
              variable: {
                kind: "Variable" as const,
                name: {
                  kind: "Name" as const,
                  value: "relativePath",
                },
              },
              type: {
                kind: "NonNullType" as const,
                type: {
                  kind: "NamedType" as const,
                  name: {
                    kind: "Name" as const,
                    value: "String",
                  },
                },
              },
            },
            {
              kind: "VariableDefinition" as const,
              variable: {
                kind: "Variable" as const,
                name: {
                  kind: "Name" as const,
                  value: "params",
                },
              },
              type: {
                kind: "NonNullType" as const,
                type: {
                  kind: "NamedType" as const,
                  name: {
                    kind: "Name" as const,
                    value: getNamedType(this.paramInputType?.type).name,
                  },
                },
              },
            },
          ],
          selectionSet: {
            kind: "SelectionSet",
            selections: [
              {
                kind: "Field",
                name: {
                  kind: "Name",
                  value: this.mutationName,
                },
                arguments: [
                  {
                    kind: "Argument",
                    name: {
                      kind: "Name",
                      value: "relativePath",
                    },
                    value: {
                      kind: "Variable",
                      name: {
                        kind: "Name",
                        value: "relativePath",
                      },
                    },
                  },
                  {
                    kind: "Argument",
                    name: {
                      kind: "Name",
                      value: "params",
                    },
                    value: {
                      kind: "Variable",
                      name: {
                        kind: "Name",
                        value: "params",
                      },
                    },
                  },
                ],
                directives: [],
                selectionSet: this.docAst.selectionSet,
              },
            ],
          },
        },
      ],
    };
  }
}