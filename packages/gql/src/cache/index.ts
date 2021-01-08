import _ from "lodash";
import {
  ObjectTypeDefinitionNode,
  UnionTypeDefinitionNode,
  FieldDefinitionNode,
  NameNode,
} from "graphql";

import type { DataSource } from "../datasources/datasource";

export type Cache = {
  gql: {
    object: (
      name: string,
      def: Omit<ObjectTypeDefinitionNode, "kind" | "name">
    ) => ObjectTypeDefinitionNode;
    union: (
      name: string,
      def: Omit<UnionTypeDefinitionNode, "kind" | "name">
    ) => UnionTypeDefinitionNode;
    name: (name: string) => NameNode;
    string: (name: string) => FieldDefinitionNode;
  };
  datasource: DataSource;
};

/**
 * Initialize the cache and datastore services, which keep in-memory
 * state when being used throughout the build process.
 */
export const cacheInit = (datasource: DataSource) => {
  const cache: Cache = {
    gql: {
      object: (name, def) => {
        return {
          kind: "ObjectTypeDefinition",
          name: cache.gql.name(name),
          ...def,
        };
      },
      union: (name, def) => {
        return {
          kind: "UnionTypeDefinition",
          name: {
            kind: "Name",
            value: "DocumentUnion",
          },
        };
      },
      name: (name) => ({ kind: "Name", value: name }),
      string: (name) => {
        return {
          kind: "FieldDefinition",
          name: {
            kind: "Name",
            value: name,
          },
          arguments: [],
          type: {
            kind: "NamedType",
            name: {
              kind: "Name",
              value: "String",
            },
          },
        };
      },
    },
    datasource: datasource,
  };

  return cache;
};
