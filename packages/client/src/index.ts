export * from "./client";
export * from "./auth";
export * from "./hooks/use-form";

/**
 * A passthru function which allows editors
 * to know the temlpate string is a GraphQL
 * query or muation
 */
function graphql(strings: TemplateStringsArray) {
  return strings[0];
}
export { graphql };
