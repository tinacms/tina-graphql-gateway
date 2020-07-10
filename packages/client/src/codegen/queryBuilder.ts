import { parse, printSchema, visit } from "graphql";

export const queryBuilder = (schema) => {
  let depth = 0;
  let items = [];
  let accumulator;
  const astNode = parse(printSchema(schema));
  const visitor = {
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
                        ...node.types.map((item) => {
                          return buildInlineFragment(
                            item,
                            astNode,
                            depth,
                            items
                          );
                        }),
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
  };

  visit(astNode, { leave: visitor });
  return accumulator;
};

const buildInlineFragment = (item, astNode, depth, items) => {
  depth = depth + 1;
  const name = item.name.value;
  items.push(name);
  let fields = [];
  const visitor = {
    ObjectTypeDefinition: (node) => {
      if (node.name.value === name) {
        fields = node.fields;
      }
    },
  };
  visit(astNode, { leave: visitor });

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

const buildField = (node, astNode, depth, items) => {
  const realType = getRealType(node);

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
      ObjectTypeDefinition: (node) => {
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
