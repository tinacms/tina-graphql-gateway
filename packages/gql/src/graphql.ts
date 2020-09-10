import { graphql } from "graphql";
import type {
  GraphQLSchema,
  GraphQLFieldResolver,
  GraphQLTypeResolver,
  Source,
} from "graphql";
import { isDocumentArgs } from "./datasources/datasource";
import type { DataSource, DocumentSummary } from "./datasources/datasource";

export type ContextT = {
  datasource: DataSource;
  nextOperation?: {
    name: "getData" | "getSettings";
    args: undefined | { path: string }; // use conditional types here
  };
};

type FieldResolverArgs = undefined | { path: string };
export const documentTypeResolver: GraphQLTypeResolver<
  DocumentSummary,
  ContextT
> = (value) => {
  return value._template;
};

type FieldResolverSource = undefined | DocumentSummary;
export const fieldResolver: GraphQLFieldResolver<
  FieldResolverSource,
  ContextT,
  FieldResolverArgs
> = (source, args, context, info): any => {
  if (!source) {
    if (isDocumentArgs(args)) {
      return context.datasource.getData(args);
    }
  } else {
    const field = source?._fields[info.fieldName];
    const value = source[info.fieldName];

    if (field?.type === "select") {
      return context.datasource.getData({ path: value });
    }

    if (["string", "number"].includes(typeof value)) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((v) => {
        return {
          _template: source._template,
          _fields: {
            ...field,
          },
          ...v,
        };
      });
    }

    return {
      _template: source._template,
      _fields: {
        ...field,
      },
      ...value,
    };
  }
};

export const graphqlInit = async (args: {
  schema: GraphQLSchema;
  source: string | Source;
  contextValue: ContextT;
  variableValues: { path: string };
}) => {
  return await graphql({
    ...args,
    fieldResolver: fieldResolver,
    typeResolver: documentTypeResolver,
  });
};
