import _ from "lodash";
import { graphql } from "graphql";
import { GraphQLSchema, Source } from "graphql";

import { resolver } from "./field-resolver";

import type { DataSource } from "../datasources/datasource";
import type { DirectorySection } from "../types";
import type { GraphQLResolveInfo } from "graphql";

export type ContextT = {
  datasource: DataSource;
};
type FieldResolverArgs = { [argName: string]: unknown };

export type InitialSource =
  | {
      _resolver: "_resource";
      _resolver_kind: "_initial";
    }
  | {
      _resolver: "_resource";
      _resolver_kind: "_nested_source";
      _args: { fullPath: string; section: string };
    }
  | {
      _resolver: "_resource";
      _resolver_kind: "_nested_sources";
      _args: { fullPaths: string[]; section: string };
    };

type FieldResolverSource = {
  [key: string]: InitialSource | unknown;
};
export const graphqlInit = async (a: {
  schema: GraphQLSchema;
  source: string | Source;
  contextValue: ContextT;
  variableValues: object;
  sectionMap: {
    [key: string]: {
      section: DirectorySection;
    };
  };
}) => {
  const { sectionMap, ...rest } = a;
  return await graphql({
    ...rest,
    fieldResolver: async (
      source: FieldResolverSource,
      args: FieldResolverArgs,
      context: ContextT,
      info: GraphQLResolveInfo
    ) => {
      return resolver.schema(source, args, context, info, sectionMap);
    },
    rootValue: {
      document: {
        _resolver: "_resource",
        _resolver_kind: "_initial",
      },
    },
  });
};
