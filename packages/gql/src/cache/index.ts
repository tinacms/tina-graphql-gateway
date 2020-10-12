import _ from "lodash";
import {
  getNamedType,
  GraphQLType,
  GraphQLString,
  GraphQLObjectType,
} from "graphql";

import type { DataSource } from "../datasources/datasource";

const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

/**
 * Holds an in-memory cache of GraphQL Objects which have been built, allowing
 * re-use and avoiding name collisions
 *
 * ```js
 * // ex. Any other uses of "SomeName" will return the cached version
 * await cache.build(new GraphQLObjectType({name: 'SomeName', fields: {...}})
 * ```
 */
export type Cache = {
  /** Pass any GraphQLType through and it will check the cache before creating a new one to avoid duplicates */
  build: <T extends GraphQLType>(
    name: string,
    callback: () => Promise<T>
  ) => Promise<T>;
  datasource: DataSource;
};

/**
 * Initialize the cache and datastore services, which keep in-memory
 * state when being used throughout the build process.
 */
let count = 0;
export const cacheInit = (datasource: DataSource) => {
  const storage: { [key: string]: GraphQLType } = {};
  const storageThing: { [key: string]: boolean } = {};
  const cache: Cache = {
    build: async (name, gqlType) => {
      count = count + 1;
      // await sleep(100);
      console.log(count, name, storage[name]);

      if (storage[name]) {
        return storage[name];
      } else {
        storageThing[name] = true;
        storage[name] = await gqlType();
      }

      return storage[name] as any; // allows gqlType's internal type to pass through
    },
    datasource: datasource,
  };

  return cache;
};
