import {
  parse,
  isLeafType,
  visit,
  GraphQLNamedType,
  GraphQLSchema,
  Visitor,
  ASTKindToNode,
  GraphQLField,
  DocumentNode,
  ASTNode,
  getNamedType,
  TypeInfo,
  visitWithTypeInfo,
  FieldNode,
  InlineFragmentNode,
  GraphQLObjectType,
  GraphQLUnionType,
  print,
  isScalarType,
} from "graphql";
import set from "lodash.set";
import get from "lodash.get";
import { friendlyName } from "./util";

type VisitorType = Visitor<ASTKindToNode, ASTNode>;

/**
 *
 * Given a valid GraphQL query,the `formBuilder` will populate the query
 * with additional information needed by Tina on the frontend so we're able
 * to render a Tina form.
 *
 *  ```graphql
 *    query getPostsDocument($relativePath: String!) {
 *      getPostsDocument(relativePath: $relativePath) {
 *        data {
 *          ... on Post_Doc_Data {
 *            title
 *          }
 *        }
 *      }
 *    }
 *  ```
 *  Would become:
 *  ```graphql
 *  query getPostsDocument($relativePath: String!) {
 *    getPostsDocument(relativePath: $relativePath) {
 *      data {
 *        ... on Post_Doc_Data {
 *          title
 *        }
 *      }
 *      form {
 *        __typename
 *        ... on Post_Doc_Form {
 *          label
 *          name
 *          fields {
 *            # ...
 *          }
 *        }
 *      }
 *      values {
 *        __typename
 *        ... on Post_Doc_Values {
 *          title
 *          author
 *          image
 *          hashtags
 *          _body
 *          _template
 *        }
 *      }
 *      sys {
 *        filename
 *        basename
 *        breadcrumbs
 *        path
 *        relativePath
 *        extension
 *      }
 *    }
 *  }
 * ```
 */
export const formBuilder = (query: DocumentNode, schema: GraphQLSchema) => {
  const typeInfo = new TypeInfo(schema);

  const pathsToPopulate: {
    path: string;
    paths: {
      path: string[];
      ast: object;
    }[];
  }[] = [];

  const visitor: VisitorType = {
    leave(node, key, parent, path, ancestors) {
      const type = typeInfo.getType();
      if (type) {
        const namedType = getNamedType(type);
        if (namedType.toString() === "Query") {
          if (node.kind === "SelectionSet") {
            if (
              !node.selections.find(
                // @ts-ignore
                (item) => item.name.value === "_queryString"
              )
            ) {
              // @ts-ignore FIXME: should be readonly
              node.selections.push({
                kind: "Field",
                name: {
                  kind: "Name",
                  value: "_queryString",
                },
              });
            }
          }
        }

        if (namedType instanceof GraphQLObjectType) {
          const hasNodeInterface = !!namedType
            .getInterfaces()
            .find((i) => i.name === "Node");
          if (hasNodeInterface) {
            // Instead of this, there's probably a more fine-grained visitor key to use
            if (typeof path[path.length - 1] === "number") {
              assertIsObjectType(namedType);

              const valuesNode = namedType.getFields().values;
              const namedValuesNode = getNamedType(
                valuesNode.type
              ) as GraphQLNamedType;
              const pathForValues = [...path];
              pathForValues.push("selectionSet");
              pathForValues.push("selections");
              const valuesAst = buildValuesForType(namedValuesNode);
              // High number to make sure this index isn't taken
              // might be more performant for it to be a low number though
              // use setWith instead
              pathForValues.push(100);

              const formNode = namedType.getFields().form;
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
              pathForForm.push(101);

              const sysNode = namedType.getFields().sys;
              const namedSysNode = getNamedType(
                sysNode.type
              ) as GraphQLNamedType;
              const pathForSys = [...path];
              pathForSys.push("selectionSet");
              pathForSys.push("selections");
              const sysAst = buildSysForType(namedSysNode);
              pathForSys.push(102);

              pathsToPopulate.push({
                path: path.map((p) => p.toString()).join("-"),
                paths: [
                  {
                    path: pathForValues.map((p) => p.toString()),
                    ast: valuesAst,
                  },
                  {
                    path: pathForForm.map((p) => p.toString()),
                    ast: formAst,
                  },
                  {
                    path: pathForSys.map((p) => p.toString()),
                    ast: sysAst,
                  },
                ],
              });
            }
          }
        }
      }
    },
  };

  visit(query, visitWithTypeInfo(typeInfo, visitor));

  // We don't want to build form/value fields for nested nodes (for now)
  // so filter out paths which aren't "top-level" ones
  const topLevelPaths = pathsToPopulate.filter((p, i) => {
    const otherPaths = pathsToPopulate.filter((_, index) => index !== i);
    const isChildOfOtherPaths = otherPaths.some((op) => {
      if (p.path.startsWith(op.path)) {
        return true;
      } else {
        return false;
      }
    });
    if (isChildOfOtherPaths) {
      return false;
    } else {
      return true;
    }
  });
  topLevelPaths.map((p) => {
    p.paths.map((pathNode) => {
      set(query, pathNode.path, pathNode.ast);
    });
  });

  return query;
};

/**
 *
 * Builds out `sys` values except for `section`
 *
 * TODO: if `sys` is already provided, use that, or provide
 * an alias query for this node
 *
 */
const buildSysForType = (type: GraphQLNamedType): FieldNode => {
  assertIsObjectType(type);

  return {
    kind: "Field" as const,
    name: {
      kind: "Name" as const,
      value: "sys",
    },
    selectionSet: {
      kind: "SelectionSet" as const,
      selections: buildFields(
        // Limit this from being recursive
        Object.values(type.getFields()).filter(
          (field) => field.name !== "section"
        )
      ),
    },
  };
};

const buildValuesForType = (type: GraphQLNamedType): FieldNode => {
  assertIsUnionType(type);

  return {
    kind: "Field" as const,
    name: {
      kind: "Name" as const,
      value: "values",
    },
    selectionSet: {
      kind: "SelectionSet" as const,
      selections: buildTypes(type.getTypes()),
    },
  };
};

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
      selections: buildTypes(type.getTypes()),
    },
  };
};

const buildTypes = (
  types: GraphQLObjectType<any, any>[],
  callback?: (
    fields: GraphQLField<any, any>[]
  ) => { continue: boolean; filteredFields: GraphQLField<any, any>[] }
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
                    selections: [...buildTypes(namedType.getTypes(), callback)],
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
                      ...buildFields(
                        Object.values(namedType.getFields()),
                        callback
                      ),
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

const buildFields = (
  fields: GraphQLField<any, any>[],
  callback?: (
    fields: GraphQLField<any, any>[]
  ) => { continue: boolean; filteredFields: GraphQLField<any, any>[] }
): FieldNode[] => {
  let filteredFields = fields;
  if (callback) {
    const result = callback(fields);
    if (!result.continue) {
      if (
        fields.every((field) => {
          return !isScalarType(getNamedType(field.type));
        })
      ) {
        return [
          {
            kind: "Field" as const,
            name: {
              kind: "Name" as const,
              value: "__typename",
            },
          },
        ];
      }
      return buildFields(
        result.filteredFields.filter((field) => {
          if (isScalarType(getNamedType(field.type))) {
            return true;
          }
          return false;
        })
      );
    } else {
      filteredFields = result.filteredFields;
    }
  }

  return filteredFields.map(
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
            selections: [...buildTypes(namedType.getTypes(), callback)],
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
              ...buildFields(Object.values(namedType.getFields()), callback),
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
            selections: [],
          },
        };
      }
    }
  );
};

interface NodeType {
  sys: object;
  data: object;
  form: object;
  values: object;
}

export const splitDataNode = (args: {
  queryFieldName: string;
  queryString: string;
  node: NodeType;
  schema: GraphQLSchema;
}) => {
  const { schema, queryFieldName } = args;
  const typeInfo = new TypeInfo(schema);
  const queryType = schema.getQueryType();
  const mutationType = schema.getMutationType();
  const queries: {
    [key: string]: {
      query: string;
      mutation: string;
    };
  } = {};
  const queryAst = parse(args.queryString);
  const visitor: VisitorType = {
    leave: {
      Field(node, key, parent, path, ancestors) {
        const type = typeInfo.getType();
        if (type) {
          const namedType = getNamedType(type);
          if (namedType instanceof GraphQLObjectType) {
            const implementsNodeInterface = !!namedType
              .getInterfaces()
              .find((i) => i.name === "Node");

            if (implementsNodeInterface) {
              // @ts-ignore
              const f = Object.values(queryType?.getFields()).find((field) => {
                const queryNamedType = getNamedType(field.type);
                return queryNamedType.name === namedType.name;
              });
              const mutationFields = mutationType?.getFields();
              if (!mutationFields) {
                throw new Error("oh no");
              }
              const m = Object.values(mutationFields).find((field) => {
                const mutationNamedType = getNamedType(field.type);
                return mutationNamedType.name === namedType.name;
              });
              if (!f) {
                throw new Error("oh no");
              }
              const paramInputType = m?.args.find((arg) => {
                return arg.name === "params";
              });
              if (!paramInputType) {
                throw new Error("oh no");
              }
              if (!m) {
                throw new Error("oh no");
              }

              const docAst = get(queryAst, path);
              const newQuery: DocumentNode = {
                kind: "Document" as const,
                definitions: [
                  {
                    kind: "OperationDefinition" as const,
                    operation: "query",
                    name: {
                      kind: "Name" as const,
                      value: f.name,
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
                            value: f.name,
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
                          selectionSet: docAst.selectionSet,
                        },
                      ],
                    },
                  },
                ],
              };
              const newMutation: DocumentNode = {
                kind: "Document" as const,
                definitions: [
                  {
                    kind: "OperationDefinition" as const,
                    operation: "mutation",
                    name: {
                      kind: "Name" as const,
                      value: m.name,
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
                              value: getNamedType(paramInputType?.type).name,
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
                            value: m.name,
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
                          selectionSet: docAst.selectionSet,
                        },
                      ],
                    },
                  },
                ],
              };
              let dataPath: string[] = [];
              const anc = ancestors[0];
              const pathAccum: (string | number)[] = [];
              path.map((p, i) => {
                pathAccum.push(p);
                const item: ASTNode | ASTNode[] = get(anc, pathAccum);
                if (Array.isArray(item)) {
                } else {
                  switch (item.kind) {
                    case "OperationDefinition":
                      break;
                    case "SelectionSet":
                      break;
                    case "InlineFragment":
                      break;
                    case "Field":
                      dataPath.push(item.name?.value);
                      break;
                  }
                }
              });
              queries[dataPath.join(".")] = {
                query: print(newQuery),
                mutation: print(newMutation),
              };
            }
          }
        }
      },
    },
  };
  visit(queryAst, visitWithTypeInfo(typeInfo, visitor));

  return queries;
};

/**
 *
 * This generates a query to a "reasonable" depth for the data key of a given section
 * It's not meant for production use
 */
export const queryGenerator = (
  variables: { relativePath: string; section: string },
  schema: GraphQLSchema
): DocumentNode => {
  const t = schema.getQueryType();
  const queryFields = t?.getFields();
  if (queryFields) {
    const queryName = `get${friendlyName(variables.section)}Document`;
    const queryField = queryFields[queryName];

    const returnType = getNamedType(queryField.type);
    if (returnType instanceof GraphQLObjectType) {
      let depth = 0;
      const fields = buildFields(
        Object.values(returnType.getFields()).filter(
          (field) => field.name === "data"
        ),
        (fields) => {
          const filteredFieldsList = [
            "sys",
            "__typename",
            "template",
            "html",
            "form",
            "values",
            "markdownAst",
          ];
          depth = depth + 1;
          const filteredFields = fields.filter((field) => {
            return !filteredFieldsList.includes(field.name);
          });

          return { continue: depth < 5, filteredFields };
        }
      );

      return {
        kind: "Document" as const,
        definitions: [
          {
            kind: "OperationDefinition" as const,
            operation: "query",
            name: {
              kind: "Name" as const,
              value: queryName,
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
                    value: queryName,
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
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: fields,
                  },
                },
              ],
            },
          },
        ],
      };
    } else {
      throw new Error(
        "Expected return type to be an instance of GraphQLObject"
      );
    }
  } else {
    throw new Error("Unable to find query fields for provided schema");
  }
};

/**
 *
 * This generates a query to a "reasonable" depth for the data key of a given section
 * It's not meant for production use
 */
export const mutationGenerator = (
  variables: { relativePath: string; section: string },
  schema: GraphQLSchema
): DocumentNode => {
  const t = schema.getQueryType();
  const queryFields = t?.getFields();
  if (queryFields) {
    const mutationName = `update${friendlyName(variables.section)}Document`;
    const queryName = `get${friendlyName(variables.section)}Document`;
    const queryField = queryFields[queryName];

    const returnType = getNamedType(queryField.type);
    if (returnType instanceof GraphQLObjectType) {
      let depth = 0;
      const fields = buildFields(
        Object.values(returnType.getFields()).filter(
          (field) => field.name === "data"
        ),
        (fields) => {
          const filteredFieldsList = [
            "sys",
            "__typename",
            "template",
            "html",
            "form",
            "values",
            "markdownAst",
          ];
          depth = depth + 1;
          const filteredFields = fields.filter((field) => {
            return !filteredFieldsList.includes(field.name);
          });

          return { continue: depth < 5, filteredFields };
        }
      );

      return {
        kind: "Document" as const,
        definitions: [
          {
            kind: "OperationDefinition" as const,
            operation: "mutation",
            name: {
              kind: "Name" as const,
              value: mutationName,
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
                      value: `${friendlyName(variables.section)}_Input`,
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
                    value: mutationName,
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
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: fields,
                  },
                },
              ],
            },
          },
        ],
      };
    } else {
      throw new Error(
        "Expected return type to be an instance of GraphQLObject"
      );
    }
  } else {
    throw new Error("Unable to find query fields for provided schema");
  }
};

function assertIsObjectType(
  type: GraphQLNamedType
): asserts type is GraphQLObjectType {
  if (type instanceof GraphQLObjectType) {
    // do nothing
  } else {
    throw new Error(
      `Expected an instance of GraphQLObjectType for type ${type.name}`
    );
  }
}
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
