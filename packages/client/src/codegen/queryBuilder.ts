import {
  parse,
  printSchema,
  visit,
  print,
  GraphQLSchema,
  Visitor,
  ASTKindToNode,
  ASTNode,
  getIntrospectionQuery,
  BREAK,
  Kind,
} from "graphql";
import fs from "fs";
import ast from "./ast.json";

export const queryBuilder = (schema) => {
  // console.log(Kind);
  let depth = 0;
  let items = [];
  const astNode = parse(printSchema(schema));
  const visitor = {
    UnionTypeDefinition: (node, key, parent, path, ancestors) => {
      if (node.name.value === "DocumentUnion") {
        const accumulator = {
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
                    value: "document",
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
                      selections: node.types.map((item) => {
                        return buildInlineFragment(item, astNode, depth, items);
                      }),
                    },
                  },
                ],
              },
            },
          ],
        };
        // console.log(accumulator);
        fs.writeFile(
          "/Users/jeffsee/code/scratch/graphql-demo/apps/demo/.forestry/queryAst.json",
          JSON.stringify(accumulator, null, 2),
          () => {}
        );
        fs.writeFile(
          "/Users/jeffsee/code/scratch/graphql-demo/apps/demo/.forestry/queryPrint.gql",
          // @ts-ignore
          print(accumulator),
          () => {}
        );
      }
    },
  };

  visit(astNode, { leave: visitor });

  return ast;
};

const buildInlineFragment = (item, astNode, depth, items) => {
  depth = depth + 1;
  if (depth > 5) {
    return {
      kind: "Field",
      name: {
        kind: "Name",
        value: "__typename",
      },
      arguments: [],
      directives: [],
    };
  }
  const name = item.name.value;
  if (items.includes(name)) {
    return {
      kind: "Field",
      name: {
        kind: "Name",
        value: "__typename",
      },
      arguments: [],
      directives: [],
    };
  }
  items.push(name);
  let fields = [];
  const visitor = {
    ObjectTypeDefinition: (node, key, parent, path, ancestors) => {
      if (node.name.value === name) {
        fields = node.fields;
      }
    },
  };
  visit(astNode, { leave: visitor });
  // console.log(item);
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
      selections: fields.map((field) => {
        const realType = getRealType(field);

        if (realType.name.value === "String") {
          return {
            kind: "Field",
            name: {
              kind: "Name",
              value: field.name.value,
            },
            arguments: [],
            directives: [],
          };
        } else {
          let fields = [];
          let union = [];
          const visitor = {
            ObjectTypeDefinition: (node, key, parent, path, ancestors) => {
              if (node.name.value === realType.name.value) {
                fields = node.fields;
              }
            },
            UnionTypeDefinition: (node) => {
              if (node.name.value === realType.name.value) {
                union = node.types;
              }
            },
          };
          visit(astNode, { leave: visitor });
          return {
            kind: "Field",
            name: {
              kind: "Name",
              value: field.name.value,
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
      }),
    },
  };
};

const buildField = (node, astNode, depth, items) => {
  if (depth > 5) {
    return "__typename";
  }
  const realType = getRealType(node);
  const name = node.name.value;
  if (items.includes(name)) {
    return "__typename";
  }

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
    let fields = [];
    let union = [];
    const visitor = {
      ObjectTypeDefinition: (node, key, parent, path, ancestors) => {
        if (node.name.value === realType.name.value) {
          fields = node.fields;
        }
      },
      UnionTypeDefinition: (node) => {
        if (node.name.value === realType.name.value) {
          union = node.types;
        }
      },
    };
    visit(astNode, { leave: visitor });
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

const getRealType = (node) => {
  if (node.type.kind === "NonNullType") {
    return node.type.type;
  } else if (node.type.kind === "ListType") {
    return node.type.type;
  } else {
    return node.type;
  }
};
