import _ from "lodash";
import { graphql } from "graphql";
import { GraphQLSchema, Source } from "graphql";

import { resolver } from "./field-resolver";

import type { DataSource } from "../datasources/datasource";

export type ContextT = {
  datasource: DataSource;
};

export const graphqlInit = async (args: {
  schema: GraphQLSchema;
  source: string | Source;
  contextValue: ContextT;
  variableValues: object;
}) => {
  return await graphql({
    ...args,
    fieldResolver: resolver.schema,
    rootValue: {
      document: {
        _resolver: "_resource",
        _resolver_kind: "_initial",
      },
    },
  });
};
