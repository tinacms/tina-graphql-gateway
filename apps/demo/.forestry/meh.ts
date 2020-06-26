const nextVisitor = ({
  kind,
  item = null,
  types = null,
  ast,
  accumulator,
  lookup,
}: {
  kind: string;
  item?: string;
  types?: any[];
  ast: ASTNode;
  accumulator: object;
  lookup: string;
}) => {
  return {
    ObjectTypeDefinition: (node, key, parent, path, ancestors) => {
      // if (node.type.kind === "NonNullType") {
      //   return false;
      // }
      if (kind === "ObjectTypeDefinition") {
        // console.log(node);
        const buildSelectionSet = (node) => {
          return {
            kind: "SelectionSet",
            selections: node.fields.map((field) => {
              const fieldType = getRealNodeType(field);
              if (fieldType === "String") {
                return {
                  kind: "Field",
                  name: {
                    kind: "Name",
                    value: field.name.value,
                  },
                };
              } else {
                return visit(ast, {
                  leave: nextVisitor({
                    kind: "FieldDefinition",
                    item: field.name.value,
                    ast,
                    accumulator,
                    lookup: field.name.value,
                  }),
                });
              }
            }),
          };
        };
        if (types) {
          const typeNames = types.map((type) => type.name.value);
          const accum = [];
          if (typeNames.includes(node.name.value)) {
            accumulator[lookup][node.name.value] = {
              selectionSet: buildSelectionSet(node),
            };

            accum.push(node);
          }
        }
        if (item) {
          if (node.name.value === item) {
            accumulator[lookup] = {
              selectionSet: buildSelectionSet(node),
            };
          }
        }
      }
    },
    FieldDefinition: (node, key, parent, path, ancestors) => {
      if (kind === "FieldDefinition" && node.name.value === item) {
        if (node.type.kind === "ListType") {
          // console.log(JSON.stringify(node, null, 2));
          visit(ast, {
            leave: nextVisitor({
              kind: "ObjectTypeDefinition",
              item: node.type.type.name.value,
              ast,
              accumulator,
              lookup: node.name?.value,
            }),
          });
        } else {
          visit(ast, {
            leave: nextVisitor({
              kind: "ObjectTypeDefinition",
              item: node.type.name?.value,
              ast,
              accumulator,
              lookup: node.name?.value,
            }),
          });
        }
      }
    },
  };
};

const getRealNodeType = (node) => {
  if (node.type?.kind === "NonNullType") {
    return node.type.type.name.value;
  } else if (node.type?.kind === "ListType") {
    return node.type.type.name.value;
  } else {
    return node.type.name.value;
  }
};
