import { graphql } from "graphql";
import type {
  GraphQLSchema,
  GraphQLFieldResolver,
  GraphQLTypeResolver,
  Source,
} from "graphql";
import { isDocumentArgs } from "./datasources/datasource";
import { text } from "./fields/text";
import { select } from "./fields/select";
import { blocks } from "./fields/blocks";
import type {
  DataSource,
  DocumentSummary,
  DocumentPartial,
} from "./datasources/datasource";

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

type FieldResolverSource = undefined | DocumentSummary | DocumentPartial;

const GETTER = "getter";
const SETTER = "setter";
const MUTATOR = "mutator";

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

    if (field?.type === "textarea") {
      return text.getter({ value, field });
    }

    if (field?.type === "select") {
      return select.getter({ value, field, datasource: context.datasource });
    }

    if (field?.type === "blocks") {
      return blocks.getter({ value, field, datasource: context.datasource });
    }

    return {
      _resolveType: GETTER,
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
    // @ts-ignore
    fieldResolver: fieldResolver,
    typeResolver: documentTypeResolver,
  });
};
