/**
Copyright 2021 Forestry.io Holdings, Inc.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import p from "path";
import _ from "lodash";
import matter from "gray-matter";
import * as jsyaml from "js-yaml";
import DataLoader from "dataloader";
import LRU from "lru-cache";

import { byTypeWorks } from "../types";
import { FieldGroupField } from "../fields/field-group";
import { FieldGroupListField } from "../fields/field-group-list";
import { sequential } from "../util";

import type { Field } from "../fields";
import {
  DataSource,
  AddArgs,
  UpdateArgs,
  DocumentArgs,
  TinaDocument,
} from "./datasource";
import type {
  Settings,
  DirectorySection,
  RawTemplate,
  TemplateData,
  WithFields,
} from "../types";
import { Octokit } from "@octokit/rest";

// const tinaPath = ".tina";
const tinaPath = ".tina/__generated__/config";

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

const getAndSetFromCache = async (
  { owner, repo, ref }: { owner: string; repo: string; ref: string },
  key: string,
  setter: () => Promise<string | string[]>
) => {
  const keyName = `${owner}:${repo}:${ref}__${key}`;
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

type GithubManagerInit = {
  rootPath: string;
  accessToken: string;
  owner: string;
  repo: string;
  ref: string;
};

export class GithubManager {
  rootPath: string;
  repoConfig: Pick<GithubManagerInit, "owner" | "ref" | "repo">;
  appOctoKit: Octokit;
  constructor({ rootPath, accessToken, owner, repo, ref }: GithubManagerInit) {
    this.rootPath = rootPath;
    this.repoConfig = {
      owner,
      repo,
      ref,
    };
    this.appOctoKit = new Octokit({
      auth: accessToken,
    });
  }

  readFile = async (path: string) => {
    return this.appOctoKit.repos
      .getContent({
        ...this.repoConfig,
        path: p.join(this.rootPath, path),
      })
      .then((response) => Buffer.from(response.data.content, "base64"));
  };
  readDir = async (path: string) => {
    return this.appOctoKit.repos
      .getContent({
        ...this.repoConfig,
        path: p.join(this.rootPath, path),
      })
      .then((response) => {
        if (Array.isArray(response.data)) {
          return response.data.map((d) => d.name);
        }

        throw new Error(
          `Expected to return an array from Github directory ${path}`
        );
      });
  };
  writeFile = async (path: string, content: string) => {
    // check if the file exists
    let fileSha = undefined;
    try {
      const fileContent = await this.appOctoKit.repos.getContent({
        ...this.repoConfig,
        path: p.join(this.rootPath, path),
      });

      fileSha = fileContent.data.sha;
    } catch (e) {
      console.log("No file exists, creating new one");
    }

    await this.appOctoKit.repos.createOrUpdateFileContents({
      ...this.repoConfig,
      message: "Update from GraphQL client",
      path: p.join(this.rootPath, path),
      content: new Buffer(content).toString("base64"),
      sha: fileSha,
    });
  };
}
