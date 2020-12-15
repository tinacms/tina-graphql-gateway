import fs from "fs-extra";
import p from "path";
import _ from "lodash";
import matter from "gray-matter";
import * as jsyaml from "js-yaml";
import { slugify } from "../util";
import DataLoader from "dataloader";

import { byTypeWorks, Section } from "../types";
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

export class FileSystemManager implements DataSource {
  rootPath: string;
  loader: DataLoader<unknown, unknown, unknown>;
  dirLoader: DataLoader<unknown, unknown, unknown>;
  constructor(rootPath: string) {
    this.rootPath = rootPath;
    // This is not an application cache - in-memory batching is its purpose
    // read a good conversation on it here https://github.com/graphql/dataloader/issues/62

    /**
     * DataLoader should be initialized as an in-memory, per-request cache, so initializing it
     * here makes sense as it will be cleared for each request. The only time we need to clear
     * it ourselves is when there's a cached value as part of the mutation process, which then
     * needs to return the new value
     */
    this.loader = new DataLoader(batchReadFileFunction);
    this.dirLoader = new DataLoader(batchReadDirFunction);

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
  getAllTemplates = async () => {
    const fullPath = p.join(this.rootPath, ".tina/front_matter/templates");
    const templates = await readDir(fullPath, this.dirLoader);
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
    const { data } = await readFile<Settings>(
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
  // FIXME: clean this up
  getSectionByPath = async (path: string) => {
    const data = await this.getSettingsData();

    const sections = data.sections.map((section) => {
      return {
        ...section,
        slug: slugify(section.label),
      };
    });

    const main = sections.reduce(
      (previous: { length: number; item: Section | null }, section) => {
        const length = path.replace(section.path, "").length;
        if (length < previous.length) {
          return { length, item: section };
        }
        return previous;
      },
      { length: 1000, item: null }
    );
    if (!main.item) {
      throw new Error(`Unable to find section for path ${path}`);
    }
    return main.item;
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
    return await readFile<TinaDocument>(fullPath, this.loader);
  };
  getTemplateForDocument = async (args: DocumentArgs) => {
    const sectionData = await this.getSettingsForSection(args.section);
    if (!sectionData) {
      throw new Error(`No section found for ${args.section}`);
    }
    const fullPath = p.join(this.rootPath, ".tina/front_matter/templates");
    const templates = await readDir(fullPath, this.dirLoader);

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
    const templates = await readDir(fullPath, this.dirLoader);
    const template = templates.find((templateBasename) => {
      return templateBasename === `${slug}.yml`;
    });
    if (!template) {
      throw new Error(`No template found for slug ${slug}`);
    }
    const { data } = await readFile<RawTemplate>(
      p.join(fullPath, template),
      this.loader
    );

    return namespaceFields({ name: slug, ...data });
  };
  getTemplateWithoutName = async (
    slug: string,
    options: { namespace: boolean } = { namespace: true }
  ) => {
    const fullPath = p.join(this.rootPath, ".tina/front_matter/templates");
    const templates = await readDir(fullPath, this.dirLoader);
    const template = templates.find((templateBasename) => {
      return templateBasename === `${slug}.yml`;
    });
    if (!template) {
      throw new Error(`No template found for slug ${slug}`);
    }
    const { data } = await readFile<RawTemplate>(
      p.join(fullPath, template),
      this.loader
    );

    return data;
  };
  addDocument = async ({ relativePath, section, template }: AddArgs) => {
    const fullPath = p.join(this.rootPath, ".tina/front_matter/templates");
    const sectionData = await this.getSettingsForSection(section);
    const templateData = await this.getTemplateWithoutName(template, {
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
    await writeFile(p.join(this.rootPath, path), "---");
    const string = "---\n" + jsyaml.dump(updatedTemplateData);
    await writeFile(p.join(fullPath, `${template}.yml`), string);
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
    const { _body, ...data } = params;
    const string = matter.stringify(_body || "", data);

    await fs.outputFile(fullPath, string);
  };
}

async function batchReadFileFunction(keys: readonly string[]) {
  const results: { [key: string]: unknown } = {};
  await Promise.all(
    keys.map(async (key) => (results[key] = await internalReadFile(key)))
  );
  return keys.map((key) => results[key] || new Error(`No result for ${key}`));
}
async function batchReadDirFunction(keys: readonly string[]) {
  const results: { [key: string]: unknown } = {};
  await Promise.all(
    keys.map(async (key) => (results[key] = await internalReadDir(key)))
  );
  return keys.map((key) => results[key] || new Error(`No result for ${key}`));
}

const readFile = async <T>(
  path: string,
  loader: DataLoader<unknown, unknown, unknown>
): Promise<T> => {
  return (await loader.load(path)) as T;
};
const internalReadFile = async <T>(path: string): Promise<T> => {
  const extension = p.extname(path);

  switch (extension) {
    case ".yml":
      const ymlString = await fs.readFileSync(path);
      return parseMatter(ymlString);
    case ".md":
      const markdownString = await fs.readFileSync(path);
      return parseMatter(markdownString);
    default:
      throw new Error(`Unable to parse file, unknown extension ${extension}`);
  }
};

const writeFile = fs.outputFile;

const readDir = async (
  path: string,
  loader: DataLoader<unknown, unknown, unknown>
): Promise<string[]> => {
  return (await loader.load(path)) as string[];
};
const internalReadDir = async (path: string) => {
  return await fs.readdirSync(path);
};

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
