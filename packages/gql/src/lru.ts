import _ from "lodash";
import LRU from "lru-cache";

const cache = new LRU<string, string | string[]>({
  max: 50,
  length: function (v: string, key) {
    return v.length;
  },
});

/*
  ref is used as the the branch for now, so in future we may switch to commits
*/
export const clearCache = ({
  owner,
  repo,
  ref,
  path,
}: {
  owner: string;
  repo: string;
  ref: string;
  path?: string;
}) => {
  const repoPrefix = `${owner}:${repo}:${ref}__`;
  if (path) {
    const key = `${repoPrefix}${path}`;
    console.log("[LRU cache]: clearing key ", key);
    cache.del(key);
  } else {
    console.log("[LRU cache]: clearing all keys for repo ", repoPrefix);
    cache.forEach((value, key, cache) => {
      if (key.startsWith(repoPrefix)) {
        cache.del(key);
      }
    });
  }
};

export const get = async (
  keyName: string,
  setter: () => Promise<string | string[]>
) => {
  const value = cache.get(keyName);

  if (value) {
    console.log("getting from cache", keyName);
    return value;
  } else {
    console.log("item not in cache", keyName);
    const valueToCache = await setter();
    cache.set(keyName, valueToCache);
    return valueToCache;
  }
};
