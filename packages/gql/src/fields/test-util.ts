import path from "path";
import {
  GraphQLSchema,
  printSchema,
  GraphQLObjectType,
  getNamedType,
  GraphQLUnionType,
  GraphQLType,
} from "graphql";
import { FileSystemManager } from "../datasources/filesystem-manager";
import { cacheInit } from "../schema-builder";

export const testCache = ({ mockGetTemplate }: { mockGetTemplate?: any }) => {
  const projectRoot = path.join(process.cwd(), "src/fixtures/project1");
  const filesystemDataSource = new FileSystemManager(projectRoot);
  if (mockGetTemplate) {
    filesystemDataSource.getTemplate = mockGetTemplate;
  }
  const storage: {
    [key: string]: GraphQLType;
  } = {};
  return cacheInit(filesystemDataSource, storage);
};

export const assertType = (type: GraphQLObjectType<any, any>) => {
  // Useful to grab a snapshot
  // console.log(printSchema(new GraphQLSchema({ query: type })));
  return {
    matches: (gqlString: string) => {
      expect(printSchema(new GraphQLSchema({ query: type }))).toEqual(`schema {
  query: ${getNamedType(type)}
}

${gqlString}`);
    },
  };
};
export const assertNoTypeCollisions = (
  types: GraphQLObjectType<any, any>[]
) => {
  const union = new GraphQLUnionType({
    name: "MultitypeUnion",
    types: types,
  });
  const t = new GraphQLObjectType({
    name: "MultitypeObject",
    fields: { f: { type: union } },
  });
  const names = types.map((t) => getNamedType(t).toString());
  const isArrayUnique = (arr: string[]) =>
    Array.isArray(arr) && new Set(arr).size === arr.length; // add function to check that array is unique.
  try {
    expect(isArrayUnique(names)).toBeTruthy();
  } catch (e) {
    // console.error("Types are equal");
    throw new Error(`Unable to create schema with multiple identical types`);
  }
  const schema = new GraphQLSchema({ query: t });
  // Useful to grab a snapshot
  // console.log(printSchema(schema));
};

/**
 *
 * This just "dedents" the template literal, calling it "gql" has the nice
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
      // istanbul ignore next (Ignore else inside Babel generated code)
      const value = values[i];

      str += value; // interpolation
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
  return trimmedStr.replace(RegExp("^" + indent, "mg"), ""); // remove indent
}
