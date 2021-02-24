import prettier from "prettier";

/**
 *
 * This just formats the template literal with prettier so comparing strings doesn't fail
 * due to differences in whitespace, calling it "gql" has the nice
 * side-effect that IDEs often provide graphql syntax highlighting for it
 */
export function gql(strings: TemplateStringsArray | string[]): string {
  const string = Array.isArray(strings) ? strings.join("\n") : strings;
  // @ts-ignore
  return prettier.format(string, { parser: "graphql" });
}
