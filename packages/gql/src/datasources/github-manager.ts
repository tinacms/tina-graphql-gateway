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

const cache = new LRU<string, string | string[]>({
  max: 50,
  length: function (v: string, key) {
    return v.length;
  },
});

export const clearCache = ({
  owner,
  repo,
}: {
  owner: string;
  repo: string;
}) => {
  const repoPrefix = `${owner}:${repo}__`;
  console.log("clearing cache for ", repoPrefix);
  cache.forEach((value, key, cache) => {
    if (key.startsWith(repoPrefix)) {
      console.log("clearing key", key);
      cache.del(key);
    }
  });
};

const getAndSetFromCache = async (
  { owner, repo }: { owner: string; repo: string },
  key: string,
  setter: () => string | string[]
) => {
  const keyName = `${owner}:${repo}__${key}`;
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
  };
  appOctoKit: Octokit;
  constructor({
    rootPath,
    accessToken,
    owner,
    repo,
  }: {
    rootPath: string;
    accessToken: string;
    owner: string;
    repo: string;
  }) {
    // constructor(rootPath: string) {
    this.rootPath = rootPath;
    const repoConfig = {
      owner,
      repo,
    };
    this.repoConfig = repoConfig;

    const appOctoKit = new Octokit({
      auth: accessToken,
      // authStrategy: createAppAuth,
      // auth: {
      //   id: 83861,
      //   privateKey: pk,
      //   installationId: “12264194”,
      //   clientId: GH_CLIENT,
      //   clientSecret: GH_SECRET,
      // },
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
                    return parseMatter(
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

  getDocumentsForSection = async (sectionSlug?: string) => {
    const templates = await this.getTemplatesForSection(sectionSlug);
    const pages = templates.map((template) => template.pages || []);
    return _.flatten(pages);
  };
  getTemplates = async (templateSlugs: string[]) =>
    await sequential(
      templateSlugs,
      async (templateSlug) => await this.getTemplate(templateSlug)
    );
  getSettingsData = async () => {
    const { data } = await this.readFile<Settings>(
      p.join(this.rootPath, ".tina/settings.yml"),
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
      throw new Error(`Expected tofind section with slug ${section}`);
    }

    return result;
  };
  getSectionsSettings = async () => {
    const data = await this.getSettingsData();

    const sections = data.sections
      .filter((section) => section.type === "directory")
      .map((section) => {
        return {
          ...section,
          // Pretty sure this is how we define 'section' values in list/select fields
          // probably needs to be tested thoroughly to ensure the slugify function works
          // as it does in Forestry
          slug: slugify(section.label),
        };
      });

    return sections as DirectorySection[];
  };
  getTemplatesForSection = async (section?: string) => {
    const data = await this.getSettingsData();

    const sections = data.sections.map((section) => {
      return {
        ...section,
        // Pretty sure this is how we define 'section' values in list/select fields
        // probably needs to be tested thoroughly to ensure the slugify function works
        // as it does in Forestry
        slug: slugify(section.label),
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
    const fullPath = p.join(this.rootPath, ".tina/front_matter/templates");
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
    const fullPath = p.join(this.rootPath, ".tina/front_matter/templates");
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

    if (options.namespace) {
      return namespaceFields({ name: slug, ...data });
    } else {
      return data;
    }
  };
  addDocument = async ({ relativePath, section, template }: AddArgs) => {
    const fullPath = p.join(this.rootPath, ".tina/front_matter/templates");
    const sectionData = await this.getSettingsForSection(section);
    const templateData = await this.getTemplate(template, { namespace: false });
    if (!sectionData) {
      throw new Error(`No section found for ${section}`);
    }
    const path = p.join(sectionData.path, relativePath);
    const updatedTemplateData = {
      ...templateData,
      pages: [...(templateData.pages ? templateData.pages : []), path],
    };
    await this.writeFile(p.join(this.rootPath, path), "---");
    const string = "---\n" + jsyaml.dump(updatedTemplateData);
    await this.writeFile(p.join(fullPath, `${template}.yml`), string);
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
    const string = matter.stringify("", params.data);
    await this.writeFile(fullPath, string);
  };

  async readFile<T>(
    path: string,
    loader: DataLoader<unknown, unknown, unknown>
  ): Promise<T> {
    // Uncomment to bypass dataloader for debugging
    // return await internalReadFile(path);
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
  let res;
  res = matter(data, { excerpt_separator: "<!-- excerpt -->" });

  // @ts-ignore
  return res;
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
