import prettier from "prettier";

/**
 *
 * This just formats the template literal with prettier so comparing strings doesn't fail
 * due to differences in whitespace, calling it "gql" has the nice
 * side-effect that IDEs often provide graphql syntax highlighting for it
 */
export function gql(
  strings: TemplateStringsArray,
  ...values: string[]
): string {
  let str = "";

  for (let i = 0; i < strings.length; ++i) {
    str += strings[i];
    if (i < values.length) {
      const value = values[i];

      str += value;
    }
  }
  const trimmedStr = str
    .replace(/^\n*/m, "") //  remove leading newline
    .replace(/[ \t]*$/, ""); // remove trailing spaces and tabs

  // fixes indentation by removing leading spaces and tabs from each line
  let indent = "";
  for (const char of trimmedStr) {
    if (char !== " " && char !== "\t") {
      break;
    }
    indent += char;
  }
  const string = trimmedStr.replace(RegExp("^" + indent, "mg"), ""); // remove indent
  return prettier.format(string, { parser: "graphql" });
}
