/**
Copyright 2021 Forestry.io Inc
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
import { slugify } from "../util";
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

export class GithubManager implements DataSource {
  rootPath: string;
  loader: DataLoader<unknown, unknown, unknown>;
  dirLoader: DataLoader<unknown, unknown, unknown>;
  repoConfig: {
    owner: string;
    repo: string;
    ref: string;
  };
  appOctoKit: Octokit;
  constructor({
    rootPath,
    accessToken,
    owner,
    repo,
    branch,
  }: {
    rootPath: string;
    accessToken: string;
    owner: string;
    repo: string;
    branch: string;
  }) {
    // constructor(rootPath: string) {
    this.rootPath = rootPath;
    const repoConfig = {
      owner,
      repo,
      ref: branch,
    };
    this.repoConfig = repoConfig;

    const appOctoKit = new Octokit({
      auth: accessToken,
    });
    this.appOctoKit = appOctoKit;

    // This is not an application cache - in-memory batching is its purpose
    // read a good conversation on it here https://github.com/graphql/dataloader/issues/62

    /**
     * DataLoader should be initialized as an in-memory, per-request cache, so initializing it
     * here makes sense as it will be cleared for each request. The only time we need to clear
     * it ourselves is when there's a cached value as part of the mutation process, which then
     * needs to return the new value
     */
    this.loader = new DataLoader(async function (keys: readonly string[]) {
      const results: { [key: string]: unknown } = {};
      await Promise.all(
        keys.map(async (path) => {
          const extension = p.extname(path);
          switch (extension) {
            case ".md":
            case ".yml":
              results[path] = await getAndSetFromCache(repoConfig, path, () => {
                return appOctoKit.repos
                  .getContent({
                    ...repoConfig,
                    path,
                  })
                  .then((response) => {
                    return parseMatter<string>(
                      Buffer.from(response.data.content, "base64")
                    );
                  });
              });
              break;
            default:
              throw new Error(
                `Unable to parse file, unknown extension ${extension} for path ${path}`
              );
          }
        })
      );
      return keys.map(
        (key) => results[key] || new Error(`No result for ${key}`)
      );
    });
    this.dirLoader = new DataLoader(async function (keys: readonly string[]) {
      const results: { [key: string]: unknown } = {};
      await Promise.all(
        keys.map(async (path) => {
          results[path] = await getAndSetFromCache(repoConfig, path, () => {
            return appOctoKit.repos
              .getContent({
                ...repoConfig,
                path,
              })
              .then((dirContents) => {
                if (Array.isArray(dirContents.data)) {
                  return dirContents.data.map((t) => t.name);
                } else {
                  throw new Error(
                    "Expected directory request to return an array of strings"
                  );
                }
              });
          });

          // TODO: An error I suppose
          return [];
        })
      );
      return keys.map(
        (key) => results[key] || new Error(`No result for ${key}`)
      );
    });

    // Pretty bad behavior from gray-matter, without clearing this we'd run the risk
    // of returning cached objects from different projects. This is undocumented behavior
    // but there's an issue for it here https://github.com/jonschlinkert/gray-matter/issues/106
    // There's another library which might be better if we run into trouble with this
    // https://github.com/jxson/front-matter - or perhaps we should just use remark and
    // js-yaml
    // @ts-ignore
    matter.clearCache();
  }

  getDocumentsForSection = async (sectionSlug: string) => {
    const templates = await this.getTemplatesForSection(sectionSlug);
    const pages = templates.map((template) => template.pages || []);
    return _.flatten(pages);
  };
  getAllTemplates = async () => {
    const fullPath = p.join(this.rootPath, tinaPath, `front_matter/templates`);
    const templates = await this.readDir(fullPath, this.dirLoader);
    return await sequential(
      templates,
      async (templateSlug) =>
        await this.getTemplate(templateSlug.replace(".yml", ""))
    );
  };
  getTemplates = async (templateSlugs: string[]) =>
    await sequential(
      templateSlugs,
      async (templateSlug) => await this.getTemplate(templateSlug)
    );
  getSettingsData = async () => {
    const { data } = await this.readFile<Settings>(
      p.join(this.rootPath, tinaPath, "settings.yml"),
      this.loader
    );

    return data;
  };
  getSettingsForSection = async (section?: string) => {
    const sectionsSettings = await this.getSectionsSettings();
    if (!section) {
      throw new Error(`No directory sections found`);
    }
    const result = sectionsSettings.find(({ slug }) => slug === section);

    if (!result) {
      throw new Error(`Expected to find section with slug ${section}`);
    }

    return result;
  };
  getSection = async (slug: string) => {
    const data = await this.getSettingsData();

    const sections = data.sections
      .filter((section) => section.type === "directory")
      .map((section) => {
        return {
          ...section,
          // slug is now an alias to `name` - can probably remove it but it's being used in a lot of places
          slug: section.name,
        } as DirectorySection;
      });

    const section = sections.find((section) => section.slug === slug);

    if (!section) {
      throw new Error(`Unable to find section with slug ${slug}`);
    }
    return section;
  };
  getSectionByPath = async (path: string) => {
    const data = await this.getSettingsData();

    const sections = data.sections
      .filter((section) => section.type === "directory")
      .map((section) => {
        return {
          ...section,
          // slug is now an alias to `name` - can probably remove it but it's being used in a lot of places
          slug: section.name,
        } as DirectorySection;
      });

    const section = sections.find((section) => {
      return path.startsWith(section.path);
    });
    if (!section) {
      throw new Error(`Unable to find section for path ${path}`);
    }
    return section;
  };
  getSectionsSettings = async () => {
    const data = await this.getSettingsData();

    const sections = data.sections
      .filter((section) => section.type === "directory")
      .map((section) => {
        return {
          ...section,
          // slug is now an alias to `name` - can probably remove it but it's being used in a lot of places
          slug: section.name,
        };
      });

    return sections as DirectorySection[];
  };
  getTemplatesForSection = async (section?: string) => {
    const data = await this.getSettingsData();

    const sections = data.sections.map((section) => {
      return {
        ...section,
        // slug is now an alias to `name` - can probably remove it but it's being used in a lot of places
        slug: section.name,
      };
    });

    const templates = section
      ? sections.filter(byTypeWorks("directory")).find((templateSection) => {
          return templateSection.slug === section;
        })?.templates
      : _.flatten(
          sections
            .filter(byTypeWorks("directory"))
            .map(({ templates }) => templates)
        );

    if (!templates) {
      throw new Error(`No templates found for section`);
    }

    return await sequential(templates, async (templateBasename) => {
      return await this.getTemplate(templateBasename.replace(".yml", ""));
    });
  };
  getDocumentMeta = async (args: DocumentArgs) => {
    const fullPath = p.join(this.rootPath, args.relativePath);
    const basename = p.basename(fullPath);
    const extension = p.extname(fullPath);
    return { basename, filename: basename.replace(extension, ""), extension };
  };
  getData = async ({ relativePath, section }: DocumentArgs) => {
    const sectionData = await this.getSettingsForSection(section);

    if (!sectionData) {
      throw new Error(`No section found for ${section}`);
    }

    const fullPath = p.join(this.rootPath, sectionData.path, relativePath);
    return await this.readFile<TinaDocument>(fullPath, this.loader);
  };
  getTemplateForDocument = async (args: DocumentArgs) => {
    const sectionData = await this.getSettingsForSection(args.section);
    if (!sectionData) {
      throw new Error(`No section found for ${args.section}`);
    }
    const fullPath = p.join(this.rootPath, tinaPath, "front_matter/templates");
    const templates = await this.readDir(fullPath, this.dirLoader);

    const template = (
      await sequential(templates, async (template) => {
        const data = await this.getTemplate(template.replace(".yml", ""));

        if (data.pages?.includes(p.join(sectionData.path, args.relativePath))) {
          return data;
        } else {
          return false;
        }
      })
    ).filter(Boolean)[0];

    if (!template) {
      throw new Error(
        `Unable to find template for document ${args.relativePath}`
      );
    }

    return template;
  };
  getTemplate = async (
    slug: string,
    options: { namespace: boolean } = { namespace: true }
  ) => {
    const fullPath = p.join(this.rootPath, tinaPath, "front_matter/templates");
    const templates = await this.readDir(fullPath, this.dirLoader);
    const template = templates.find((templateBasename) => {
      return templateBasename === `${slug}.yml`;
    });
    if (!template) {
      throw new Error(`No template found for slug ${slug}`);
    }
    const { data } = await this.readFile<RawTemplate>(
      p.join(fullPath, template),
      this.loader
    );

    return namespaceFields({ name: slug, ...data });
  };
  addDocument = async ({ relativePath, section, template }: AddArgs) => {
    const fullPath = p.join(this.rootPath, tinaPath, "front_matter/templates");
    const sectionData = await this.getSettingsForSection(section);
    const templateData = await this.getTemplate(template, {
      namespace: false,
    });
    if (!sectionData) {
      throw new Error(`No section found for ${section}`);
    }
    const path = p.join(sectionData.path, relativePath);
    const updatedTemplateData = {
      ...templateData,
      pages: [...(templateData.pages ? templateData.pages : []), path],
    };

    const fullFilePath = p.join(this.rootPath, path);
    const fullTemplatePath = p.join(fullPath, `${template}.yml`);

    this.loader.clear(fullFilePath);
    this.loader.clear(fullTemplatePath);
    clearCache({
      owner: this.repoConfig.owner,
      repo: this.repoConfig.repo,
      ref: this.repoConfig.ref,
      path: fullFilePath,
    });
    clearCache({
      owner: this.repoConfig.owner,
      repo: this.repoConfig.repo,
      ref: this.repoConfig.ref,
      path: fullTemplatePath,
    });

    await this.writeFile(fullFilePath, "---");

    const templateString = "---\n" + jsyaml.dump(updatedTemplateData);
    await this.writeFile(fullTemplatePath, templateString);
  };
  updateDocument = async ({ relativePath, section, params }: UpdateArgs) => {
    const sectionData = await this.getSettingsForSection(section);
    if (!sectionData) {
      throw new Error(`No section found for ${section}`);
    }
    const fullPath = p.join(this.rootPath, sectionData.path, relativePath);
    // FIXME: provide a test-case for this, might not be necessary
    // https://github.com/graphql/dataloader#clearing-cache
    this.loader.clear(fullPath);
    clearCache({
      owner: this.repoConfig.owner,
      repo: this.repoConfig.repo,
      ref: this.repoConfig.ref,
      path: fullPath,
    });
    const { _body, ...data } = params;
    const string = matter.stringify(`\n${_body || ""}`, data);
    await this.writeFile(fullPath, string);
  };

  async readFile<T>(
    path: string,
    loader: DataLoader<unknown, unknown, unknown>
  ): Promise<T> {
    // Uncomment to bypass dataloader for debugging
    // return await internalReadFile(path);
    // @ts-ignore
    return await loader.load(path);
  }

  async writeFile(path: string, content: string) {
    // check if the file exists
    let fileSha = undefined;
    try {
      const fileContent = await this.appOctoKit.repos.getContent({
        ...this.repoConfig,
        path: path,
      });

      fileSha = fileContent.data.sha;
    } catch (e) {
      console.log("No file exists, creating new one");
    }

    const response = await this.appOctoKit.repos.createOrUpdateFileContents({
      ...this.repoConfig,
      path: path,
      message: "Update from GraphQL client",
      content: new Buffer(content).toString("base64"),
      sha: fileSha,
    });

    return response;
  }

  async readDir(
    path: string,
    loader: DataLoader<unknown, unknown, unknown>
  ): Promise<string[]> {
    // @ts-ignore
    return loader.load(path);
  }
  async internalReadDir(path: string) {
    const dirContents = await this.appOctoKit.repos.getContent({
      ...this.repoConfig,
      path,
    });
    if (Array.isArray(dirContents.data)) {
      return dirContents.data.map((t) => t.name);
    }

    // TODO: An error I suppose
    return [];
  }
}

export const FMT_BASE = ".forestry/front_matter/templates";
export const parseMatter = async <T>(data: Buffer): Promise<T> => {
  const res = matter(data, {
    excerpt_separator: "<!-- excerpt -->",
  }) as unknown & { content: string };
  // Remove line break at top of _body
  res.content = res.content.replace(/^\n|\n$/g, "");

  // @ts-ignore
  return res as T;
};

function isWithFields(t: object): t is WithFields {
  return t.hasOwnProperty("fields");
}

const namespaceFields = (template: TemplateData): TemplateData => {
  return {
    ...template,
    fields: template.fields.map((f) => {
      if (isWithFields(f)) {
        return {
          ...namespaceSubFields(f, template.name),
        };
      } else {
        return {
          ...f,
          __namespace: `${template.name}`,
        };
      }
    }),
  };
};
const namespaceSubFields = (
  template: FieldGroupField | FieldGroupListField,
  parentNamespace: string
): Field => {
  return {
    ...template,
    fields: template.fields.map((f) => {
      if (isWithFields(f)) {
        return {
          ...namespaceSubFields(f, template.name),
          __namespace: `${parentNamespace}_${template.name}`,
        };
      } else {
        return {
          ...f,
        };
      }
    }),
    __namespace: parentNamespace,
  };
};
