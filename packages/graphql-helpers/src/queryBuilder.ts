import {
  parse,
  isLeafType,
  printSchema,
  visit,
  GraphQLNamedType,
  GraphQLSchema,
  Visitor,
  ASTKindToNode,
  DocumentNode,
  FieldDefinitionNode,
  ASTNode,
  SelectionNode,
  NamedTypeNode,
  NameNode,
  GraphQLFieldMap,
  getNamedType,
  TypeInfo,
  visitWithTypeInfo,
  typeFromAST,
  valueFromAST,
  FieldNode,
  InlineFragmentNode,
  GraphQLInterfaceType,
  SchemaMetaFieldDef,
  BREAK,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLUnionType,
  GraphQLString,
  GraphQLNonNull,
} from "graphql";
import set from "lodash.set";
import get from "lodash.get";

type VisitorType = Visitor<ASTKindToNode, ASTNode>;

export const formBuilder = (query: DocumentNode, schema: GraphQLSchema) => {
  const astNode = parse(printSchema(schema));
  const typeInfo = new TypeInfo(schema);

  const visitor: VisitorType = {
    leave(node, key, parent, path, ancestors) {
      const type = typeInfo.getType();
      if (type) {
        const namedType = getNamedType(type);

        if (
          // @ts-ignore FIXME: find a type-safe way to look up interfaces
          namedType._interfaces &&
          // @ts-ignore FIXME: find a type-safe way to look up interfaces
          namedType._interfaces
            // @ts-ignore FIXME: find a type-safe way to look up interfaces
            .map((interface) => interface.name)
            .includes("Node")
        ) {
          // Instead of this, there's probably a more fine-grained visitor key to
          // use
          if (typeof path[path.length - 1] === "number") {
            // visit(node, visitWithTypeInfo(typeInfo, fieldVisitor));
            let fields: FieldDefinitionNode[] = [];

            const name = namedType.name;
            const documentConfig = namedType.toConfig();
            const formNode = documentConfig.fields["form"];
            const namedFormNode = getNamedType(
              formNode.type
            ) as GraphQLNamedType;

            const pathForForm = [...path];

            pathForForm.push("selectionSet");
            pathForForm.push("selections");
            // High number to make sure this index isn't taken
            // might be more performant for it to be a low number though
            // use setWith instead
            const formAst = buildFormForType(namedFormNode);
            pathForForm.push(100);
            set(
              ancestors[0],
              pathForForm.map((p) => p.toString()),
              formAst
            );

            const pathForValues = [...path];
            pathForValues.push("selectionSet");
            pathForValues.push("selections");
            // High number to make sure this index isn't taken
            // might be more performant for it to be a low number though
            // use setWith instead
            pathForValues.push(101);
            set(
              ancestors[0],
              pathForValues.map((p) => p.toString()),
              valuesAST
            );
          }
        }
      }
    },
  };

  visit(query, visitWithTypeInfo(typeInfo, visitor));

  return query;
};

function assertIsUnionType(
  type: GraphQLNamedType
): asserts type is GraphQLUnionType {
  if (type instanceof GraphQLUnionType) {
    // do nothing
  } else {
    throw new Error(
      `Expected an instance of GraphQLUnionType for type ${type.name}`
    );
  }
}

const buildFormForType = (type: GraphQLNamedType): FieldNode => {
  assertIsUnionType(type);

  return {
    kind: "Field" as const,
    name: {
      kind: "Name" as const,
      value: "form",
    },
    selectionSet: {
      kind: "SelectionSet" as const,
      selections: [
        {
          kind: "Field" as const,
          name: {
            kind: "Name" as const,
            value: "__typename",
          },
        },
        ...buildTypes(type.getTypes()),
      ],
    },
  };
};

const buildTypes = (
  types: GraphQLObjectType<any, any>[]
): InlineFragmentNode[] => {
  return types.map((type) => {
    return {
      kind: "InlineFragment" as const,
      typeCondition: {
        kind: "NamedType" as const,
        name: {
          kind: "Name" as const,
          value: type.name,
        },
      },
      selectionSet: {
        kind: "SelectionSet" as const,
        selections: [
          {
            kind: "Field" as const,
            name: {
              kind: "Name" as const,
              value: "__typename",
            },
          },
          ...Object.values(type.getFields()).map(
            (field): FieldNode => {
              const namedType = getNamedType(field.type);
              if (isLeafType(namedType)) {
                return {
                  kind: "Field" as const,
                  name: {
                    kind: "Name" as const,
                    value: field.name,
                  },
                };
              } else if (namedType instanceof GraphQLUnionType) {
                return {
                  kind: "Field" as const,
                  name: {
                    kind: "Name" as const,
                    value: field.name,
                  },
                  selectionSet: {
                    kind: "SelectionSet" as const,
                    selections: [
                      {
                        kind: "Field" as const,
                        name: {
                          kind: "Name" as const,
                          value: "__typename",
                        },
                      },
                      ...buildTypes(namedType.getTypes()),
                    ],
                  },
                };
              } else if (namedType instanceof GraphQLObjectType) {
                return {
                  kind: "Field" as const,
                  name: {
                    kind: "Name" as const,
                    value: field.name,
                  },
                  selectionSet: {
                    kind: "SelectionSet" as const,
                    selections: [
                      {
                        kind: "Field" as const,
                        name: {
                          kind: "Name" as const,
                          value: "__typename",
                        },
                      },
                      ...buildFields(namedType.getFields()),
                    ],
                  },
                };
              } else {
                throw new Error(
                  `Unexpected GraphQL type for field ${namedType.name}`
                );
              }
            }
          ),
        ],
      },
    };
  });
};

const buildFields = (fields: GraphQLFieldMap<any, any>): FieldNode[] => {
  return Object.values(fields).map(
    (field): FieldNode => {
      const namedType = getNamedType(field.type);
      if (isLeafType(namedType)) {
        return {
          kind: "Field" as const,
          name: {
            kind: "Name" as const,
            value: field.name,
          },
        };
      } else if (namedType instanceof GraphQLUnionType) {
        return {
          kind: "Field" as const,
          name: {
            kind: "Name" as const,
            value: field.name,
          },
          selectionSet: {
            kind: "SelectionSet" as const,
            selections: [
              {
                kind: "Field" as const,
                name: {
                  kind: "Name" as const,
                  value: "__typename",
                },
              },
              ...buildTypes(namedType.getTypes()),
            ],
          },
        };
      } else if (namedType instanceof GraphQLObjectType) {
        return {
          kind: "Field" as const,
          name: {
            kind: "Name" as const,
            value: field.name,
          },
          selectionSet: {
            kind: "SelectionSet" as const,
            selections: [
              {
                kind: "Field" as const,
                name: {
                  kind: "Name" as const,
                  value: "__typename",
                },
              },
              ...buildFields(namedType.getFields()),
            ],
          },
        };
      } else {
        return {
          kind: "Field" as const,
          name: {
            kind: "Name" as const,
            value: field.name,
          },
          selectionSet: {
            kind: "SelectionSet" as const,
            selections: [
              {
                kind: "Field" as const,
                name: {
                  kind: "Name" as const,
                  value: "__typename",
                },
              },
            ],
          },
        };
      }
    }
  );
};

const buildFormForType2 = (type: GraphQLNamedType): FieldNode => {
  assertIsUnionType(type);
  const types = type.getTypes();

  return {
    kind: "Field" as const,
    name: {
      kind: "Name" as const,
      value: "form",
    },
    selectionSet: {
      kind: "SelectionSet" as const,
      selections: [
        {
          kind: "Field" as const,
          name: {
            kind: "Name" as const,
            value: "__typename",
          },
        },
        ...types.map((type) => {
          return {
            kind: "InlineFragment" as const,
            typeCondition: {
              kind: "NamedType" as const,
              name: {
                kind: "Name" as const,
                value: type.name,
              },
            },
            selectionSet: {
              kind: "SelectionSet" as const,
              selections: Object.values(type.getFields()).map(
                (field): FieldNode => {
                  const namedType = getNamedType(field.type);

                  if (isLeafType(namedType)) {
                    return {
                      kind: "Field" as const,
                      name: {
                        kind: "Name" as const,
                        value: field.name,
                      },
                    };
                  } else if (namedType instanceof GraphQLUnionType) {
                    const types = namedType.getTypes().map(
                      (type): InlineFragmentNode => {
                        return {
                          kind: "InlineFragment" as const,
                          typeCondition: {
                            kind: "NamedType" as const,
                            name: {
                              kind: "Name" as const,
                              value: type.name,
                            },
                          },
                          selectionSet: {
                            kind: "SelectionSet" as const,
                            selections: Object.values(type.getFields()).map(
                              (field): FieldNode => {
                                if (isLeafType(field)) {
                                  return {
                                    kind: "Field" as const,
                                    name: {
                                      kind: "Name" as const,
                                      value: field.name,
                                    },
                                  };
                                } else if (
                                  namedType instanceof GraphQLUnionType
                                ) {
                                  return {
                                    kind: "Field" as const,
                                    name: {
                                      kind: "Name" as const,
                                      value: field.name,
                                    },
                                    selectionSet: {
                                      kind: "SelectionSet" as const,
                                      selections: [buildFormForType(namedType)],
                                    },
                                  };
                                } else {
                                  return {
                                    kind: "Field" as const,
                                    name: {
                                      kind: "Name" as const,
                                      value: field.name,
                                    },
                                  };
                                }
                              }
                            ),
                          },
                        };
                      }
                    );
                    return {
                      kind: "Field" as const,
                      name: {
                        kind: "Name" as const,
                        value: field.name,
                      },
                      selectionSet: {
                        kind: "SelectionSet" as const,
                        selections: types,
                      },
                    };
                  } else {
                    return {
                      kind: "Field" as const,
                      name: {
                        kind: "Name" as const,
                        value: field.name,
                      },
                    };
                  }
                }
              ),
            },
          };
        }),
      ],
    },
  };
};

const valuesAST = {
  kind: "Field",
  name: {
    kind: "Name",
    value: "values",
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
    ],
  },
};
const formAST = {
  kind: "Field",
  name: {
    kind: "Name",
    value: "form",
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
    ],
  },
};

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
  item: GraphQLNamedType,
  astNode: DocumentNode,
  items: string[]
): SelectionNode => {
  const name = item.name;
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
        value: item.name,
      },
    },
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
        },
        ...fields.map((field) => {
          return buildField(field, astNode, items);
        }),
      ],
    },
  };
};

const buildField = (
  node: FieldDefinitionNode,
  astNode: DocumentNode,
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
                return buildField(item, astNode, items);
              })
            : union.map((item) => {
                const namedType = getNamedType(typeFromAST(schema, item));
                return buildInlineFragment(namedType, astNode, items);
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
// export const formBuilder2 = (query: DocumentNode, schema: GraphQLSchema) => {
//   const astNode = parse(printSchema(schema));
//   const visitor: VisitorType = {
//     leave: {
//       InlineFragment: (node, key, parent, path, ancestors) => {
//         const visitor2: VisitorType = {
//           leave: {
//             FieldDefinition: (nameNode, key, parent, path, ancestors) => {
//               if (
//                 getRealType(nameNode).name.value ===
//                 `${node.typeCondition?.name.value}_InitialValues`
//               ) {
//                 const items: any[] = [];
//                 const meh = buildField(nameNode, astNode, 0, items);

//                 node.selectionSet.selections = [
//                   ...node.selectionSet.selections,
//                   meh,
//                 ];
//               }
//             },
//             UnionTypeDefinition: (unionNode) => {
//               if (
//                 unionNode.name.value ===
//                 `${node.typeCondition?.name.value}_FormFields`
//               ) {
//                 const items: any[] = [];
//                 const meh = unionNode.types?.map((type) => {
//                   return buildInlineFragment(type, astNode, 0, items);
//                 });
//                 // console.log(JSON.stringify(meh, null, 2));
//                 // FIXME: don't overwrite, replace
//                 // @ts-ignore
//                 node.selectionSet.selections = [
//                   ...node.selectionSet.selections,
//                   {
//                     name: {
//                       kind: "Name",
//                       value: "form",
//                     },
//                     kind: "Field",
//                     selectionSet: {
//                       kind: "SelectionSet",
//                       selections: [
//                         {
//                           kind: "Field",
//                           name: {
//                             kind: "Name",
//                             value: "label",
//                           },
//                         },
//                         {
//                           kind: "Field",
//                           name: {
//                             kind: "Name",
//                             value: "name",
//                           },
//                         },
//                         {
//                           name: {
//                             kind: "Name",
//                             value: "fields",
//                           },
//                           kind: "Field",
//                           selectionSet: {
//                             kind: "SelectionSet",
//                             selections: meh,
//                           },
//                         },
//                       ],
//                     },
//                   },
//                 ];
//               }
//             },
//           },
//         };

//         visit(astNode, visitor2);
//       },
//     },
//   };

//   visit(query, visitor);

//   return query;
// };
