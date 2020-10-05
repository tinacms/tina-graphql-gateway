import _ from "lodash";
import { getNamedType, GraphQLType } from "graphql";

import type { DataSource } from "./datasources/datasource";

/**
 * Holds an in-memory cache of GraphQL Objects which have been built, allowing
 * re-use and avoiding name collisions
 *
 * ```js
 * // ex. Any other uses of "SomeName" will return the cached version
 * cache.build(new GraphQLObjectType({name: 'SomeName', fields: {...}})
 * ```
 */
export type Cache = {
  /** Pass any GraphQLType through and it will check the cache before creating a new one to avoid duplicates */
  build: <T extends GraphQLType>(gqlType: T) => T;
  datasource: DataSource;
};

/**
 * Initialize the cache and datastore services, which keep in-memory
 * state when being used throughout the build process.
 */
export const cacheInit = (datasource: DataSource) => {
  const storage: { [key: string]: GraphQLType } = {};
  const cache: Cache = {
    build: (gqlType) => {
      const name = getNamedType(gqlType).toString();
      if (storage[name]) {
        return storage[name];
      } else {
        storage[name] = gqlType;
      }

      return gqlType as any; // allows gqlType's internal type to pass through
    },
    datasource: datasource,
  };

  return cache;
};
