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

const args = {
  document: [
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
        value: "section",
      },
      value: {
        kind: "Variable",
        name: {
          kind: "Name",
          value: "section",
        },
      },
    },
  ],
  documentForSection: [
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
        value: "section",
      },
      value: {
        kind: "Variable",
        name: {
          kind: "Name",
          value: "section",
        },
      },
    },
  ],
};

const variableDefinitions = {
  document: [
    {
      kind: "VariableDefinition",
      variable: {
        kind: "Variable",
        name: {
          kind: "Name",
          value: "relativePath",
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
    {
      kind: "VariableDefinition",
      variable: {
        kind: "Variable",
        name: {
          kind: "Name",
          value: "section",
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
  documentForSection: [
    {
      kind: "VariableDefinition",
      variable: {
        kind: "Variable",
        name: {
          kind: "Name",
          value: "relativePath",
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
    {
      kind: "VariableDefinition",
      variable: {
        kind: "Variable",
        name: {
          kind: "Name",
          value: "section",
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
};

export const queryBuilder = (
  schema: GraphQLSchema,
  argumentKind: "document" | "documentForSection" = "document"
) => {
  const variableDefinitions2 = variableDefinitions[argumentKind];
  const args2 = args[argumentKind];

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
                variableDefinitions: variableDefinitions2,
                directives: [],
                selectionSet: {
                  kind: "SelectionSet",
                  selections: [
                    {
                      kind: "Field",
                      name: {
                        kind: "Name",
                        value: argumentKind,
                      },
                      arguments: args2,
                      selectionSet: {
                        kind: "SelectionSet",
                        selections: [
                          {
                            kind: "Field",
                            name: {
                              kind: "Name",
                              value: "node",
                            },
                            arguments: [],
                            directives: [],
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

  const isDocumentReference =
    fields.map((f) => f.name.value).includes("form") &&
    fields.map((f) => f.name.value).includes("data") &&
    depth > 1;

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
      selections: isDocumentReference
        ? [
            {
              kind: "Field",
              name: {
                kind: "Name",
                value: "__typename",
              },
            },
          ]
        : [
            {
              kind: "Field",
              name: {
                kind: "Name",
                value: "__typename",
              },
            },
            ...fields
              .filter((field) => {
                return true;
              })
              .map((field) => {
                return buildField(field, astNode, depth, items);
              }),
          ],
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
            if (node.name.value === "SectionUnion") {
              fields = node.fields
                ? node.fields.filter(
                    (field) => field.name.value !== "documents"
                  )
                : [];
            } else {
              fields = node.fields?.filter(
                (field) =>
                  // NOTE: we might want to remove this from the schema if we're not using it
                  field.name.value !== "absolutePath"
              ) as FieldDefinitionNode[];
            }
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

export const formBuilder = (query: DocumentNode, schema: GraphQLSchema) => {
  const astNode = parse(printSchema(schema));
  const visitor: VisitorType = {
    leave: {
      InlineFragment: (node, key, parent, path, ancestors) => {
        const visitor2: VisitorType = {
          leave: {
            FieldDefinition: (nameNode, key, parent, path, ancestors) => {
              if (
                getRealType(nameNode).name.value ===
                `${node.typeCondition?.name.value}_InitialValues`
              ) {
                const items: any[] = [];
                const meh = buildField(nameNode, astNode, 0, items);

                node.selectionSet.selections = [
                  ...node.selectionSet.selections,
                  meh,
                ];
              }
            },
            UnionTypeDefinition: (unionNode) => {
              if (
                unionNode.name.value ===
                `${node.typeCondition?.name.value}_FormFields`
              ) {
                const items: any[] = [];
                const meh = unionNode.types?.map((type) => {
                  return buildInlineFragment(type, astNode, 0, items);
                });
                // console.log(JSON.stringify(meh, null, 2));
                // FIXME: don't overwrite, replace
                // @ts-ignore
                node.selectionSet.selections = [
                  ...node.selectionSet.selections,
                  {
                    name: {
                      kind: "Name",
                      value: "form",
                    },
                    kind: "Field",
                    selectionSet: {
                      kind: "SelectionSet",
                      selections: [
                        {
                          kind: "Field",
                          name: {
                            kind: "Name",
                            value: "label",
                          },
                        },
                        {
                          kind: "Field",
                          name: {
                            kind: "Name",
                            value: "name",
                          },
                        },
                        {
                          name: {
                            kind: "Name",
                            value: "fields",
                          },
                          kind: "Field",
                          selectionSet: {
                            kind: "SelectionSet",
                            selections: meh,
                          },
                        },
                      ],
                    },
                  },
                ];
              }
            },
          },
        };

        visit(astNode, visitor2);
      },
    },
  };

  visit(query, visitor);

  return query;
};

// export const formBuilder2 = (query: DocumentNode, schema: GraphQLSchema) => {
//   const astNode = parse(printSchema(schema));
//   const visitor: VisitorType = {
//     leave: {
//       InlineFragment: (node) => {
//         const visitor2: VisitorType = {
//           leave: {
//             NamedType: (node) => {
//               buildInlineFragment(node, astNode, 1);
//             },
//           },
//         };
//         visit(astNode, visitor2);

//         node.selectionSet.selections = [
//           ...node.selectionSet.selections,
//           {
//             name: {
//               kind: "Name",
//               value: "form",
//             },
//             kind: "Field",
//             selectionSet: {
//               kind: "SelectionSet",
//               selections: [
//                 {
//                   kind: "Field",
//                   name: {
//                     kind: "Name",
//                     value: "label",
//                   },
//                 },
//               ],
//             },
//           },
//         ];
//       },

//       // Name: (node, _, other) => {
//       //   if (node.value === "node") {
//       //     console.log(JSON.stringify(other, null, 2));
//       //   }
//       // },
//     },
//   };

//   visit(query, visitor);
// };
