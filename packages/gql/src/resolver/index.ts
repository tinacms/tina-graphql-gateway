import _ from "lodash";
import { graphql } from "graphql";
import { GraphQLSchema, Source } from "graphql";

import { fieldResolver } from "./field-resolver";

import type { DataSource } from "../datasources/datasource";

export type ContextT = {
  datasource: DataSource;
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
    rootValue: {
      document: {
        _resolver: "_resource",
        _resolver_kind: "_initial",
      },
    },
  });
};
