import {
  graphql,
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLFieldResolver,
  GraphQLNonNull,
  GraphQLUnionType,
  GraphQLResolveInfo,
  GraphQLTypeResolver,
  Source,
} from "graphql";
import type { DataSource, DocumentSummary } from "./datasource";

export type ContextT = {
  datasource: DataSource;
  nextOperation?: {
    name: "getData" | "getSettings";
    args: undefined | { path: string }; // use conditional types here
  };
};

type FieldResolverArgs = undefined | { path: string };
export const graphqlInit = async (args: {
  schema: GraphQLSchema;
  source: string | Source;
  contextValue: ContextT;
  variableValues: { path: string };
  fieldResolver: GraphQLFieldResolver<any, ContextT, FieldResolverArgs>;
  typeResolver: GraphQLTypeResolver<any, ContextT>;
}) => {
  return await graphql(args);
};
