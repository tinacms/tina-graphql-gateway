import {
  parse,
  printSchema,
  visit,
  GraphQLSchema,
  Visitor,
  ASTKindToNode,
  DocumentNode,
  FieldDefinitionNode,
  ASTNode,
  SelectionNode,
  NamedTypeNode,
} from "graphql";

type VisitorType = Visitor<ASTKindToNode, ASTNode>;

export const queryBuilder = (schema: GraphQLSchema) => {
  let depth = 0;
  let items: string[] = [];
  let accumulator;
  const astNode = parse(printSchema(schema));
  const visitor: VisitorType = {
    leave: {
      UnionTypeDefinition: (node) => {
        if (node.name.value === "DocumentUnion") {
          accumulator = {
            kind: "Document",
            definitions: [
              {
                kind: "OperationDefinition",
                operation: "query",
                name: {
                  kind: "Name",
                  value: "DocumentQuery",
                },
                variableDefinitions: [
                  {
                    kind: "VariableDefinition",
                    variable: {
                      kind: "Variable",
                      name: {
                        kind: "Name",
                        value: "path",
                      },
                    },
                    type: {
                      kind: "NonNullType",
                      type: {
                        kind: "NamedType",
                        name: {
                          kind: "Name",
                          value: "String",
                        },
                      },
                    },
                    directives: [],
                  },
                ],
                directives: [],
                selectionSet: {
                  kind: "SelectionSet",
                  selections: [
                    {
                      kind: "Field",
                      name: {
                        kind: "Name",
                        value: "document",
                      },
                      arguments: [
                        {
                          kind: "Argument",
                          name: {
                            kind: "Name",
                            value: "path",
                          },
                          value: {
                            kind: "Variable",
                            name: {
                              kind: "Name",
                              value: "path",
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
                              value: "__typename",
                            },
                            arguments: [],
                            directives: [],
                          },
                          ...(node?.types?.map((item) => {
                            return buildInlineFragment(
                              item,
                              astNode,
                              depth,
                              items
                            );
                          }) || []),
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          };
        }
      },
    },
  };

  visit(astNode, visitor);
  return accumulator;
};

const buildInlineFragment = (
  item: NamedTypeNode,
  astNode: DocumentNode,
  depth: number,
  items: string[]
): SelectionNode => {
  depth = depth + 1;
  const name = item.name.value;
  items.push(name);
  let fields: FieldDefinitionNode[] = [];
  const visitor: VisitorType = {
    leave: {
      ObjectTypeDefinition: (node) => {
        if (node.name.value === name) {
          if (node.fields) {
            fields = node.fields as FieldDefinitionNode[];
          }
        }
      },
    },
  };
  visit(astNode, visitor);

  return {
    kind: "InlineFragment",
    typeCondition: {
      kind: "NamedType",
      name: {
        kind: "Name",
        value: item.name.value,
      },
    },
    directives: [],
    selectionSet: {
      kind: "SelectionSet",
      selections: fields
        .filter((field) => {
          /**
           * FIXME: this is our way of not grabbing data for
           * nested docments because it's not necessary. We should
           * instead propose linked forms to the Tina teams and
           * have a client-side fetch for nested documents, so we
           * only expose the path, which for Forestry is the
           * primary key
           *
           * The absolutePath and data checks
           * are far too brittle and the depth check should
           * be removed entirely. I'm thinking we should have some
           * sort of __connection field, but that changes the natural
           * flow of content since it would inject an extra
           * step which is specific to Tina forms. The data
           * itself should ideally not differentiate between documents.
           *
           * Meaning the end user should be able to do post.author.name.
           * They shouldn't have to worry that author is a connection
           * (post.__connection.author.name)
           */
          if (
            fields.map((f) => f.name.value).includes("absolutePath") &&
            fields.map((f) => f.name.value).includes("data") &&
            depth > 1
          ) {
            if (field.name.value === "path") {
              return true;
            }
            return false;
          }

          return true;
        })
        .map((field) => {
          return buildField(field, astNode, depth, items);
        }),
    },
  };
};

const buildField = (
  node: FieldDefinitionNode,
  astNode: DocumentNode,
  depth: number,
  items: string[]
): SelectionNode => {
  const realType = getRealType(node);

  // @ts-ignore
  if (realType.name.value === "String") {
    return {
      kind: "Field",
      name: {
        kind: "Name",
        value: node.name.value,
      },
      arguments: [],
      directives: [],
    };
  } else {
    let fields: FieldDefinitionNode[] = [];
    let union: NamedTypeNode[] = [];
    const visitor: VisitorType = {
      leave: {
        ObjectTypeDefinition: (node) => {
          // @ts-ignore
          if (node.name.value === realType.name.value) {
            fields = node.fields as FieldDefinitionNode[];
          }
        },
        UnionTypeDefinition: (node) => {
          // @ts-ignore
          if (node.name.value === realType.name.value) {
            union = node.types as NamedTypeNode[];
          }
        },
      },
    };
    visit(astNode, visitor);
    return {
      kind: "Field",
      name: {
        kind: "Name",
        value: node.name.value,
      },
      arguments: [],
      directives: [],
      selectionSet: {
        kind: "SelectionSet",
        selections:
          fields.length > 0
            ? fields.map((item) => {
                return buildField(item, astNode, depth, items);
              })
            : union.map((item) => {
                return buildInlineFragment(item, astNode, depth, items);
              }),
      },
    };
  }
};

const getRealType = (node: FieldDefinitionNode) => {
  if (node.type.kind === "NonNullType") {
    return node.type.type;
  } else if (node.type.kind === "ListType") {
    return node.type.type;
  } else {
    return node.type;
  }
};
