import { parse, printSchema, GraphQLSchema } from "graphql";
import { codegen } from "@graphql-codegen/core";
import { plugin as typescriptPlugin } from "@graphql-codegen/typescript";
import { plugin as typescriptOperationsPlugin } from "@graphql-codegen/typescript-operations";

export const generateTypes = async (schema: GraphQLSchema) => {
  try {
    const res = await codegen({
      filename: process.cwd() + "/.forestry/autoschema.gql",
      schema: parse(printSchema(schema)),
      documents: [],
      config: {},
      plugins: [{ typescript: {} }, { typescriptOperations: {} }],
      pluginMap: {
        typescript: {
          plugin: typescriptPlugin,
        },
        typescriptOperations: {
          plugin: typescriptOperationsPlugin,
        },
      },
    });
    return res;
  } catch (e) {
    console.error(e);
  }
};
