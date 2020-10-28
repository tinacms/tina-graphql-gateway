import fs from "fs-extra";
import p from "path";
import _ from "lodash";
import matter from "gray-matter";
import * as jsyaml from "js-yaml";
import { slugify } from "../util";

import { byTypeWorks } from "../types";
import { FieldGroupField } from "../fields/field-group";
import { FieldGroupListField } from "../fields/field-group-list";
import { sequential } from "../util";

import type { Field } from "../fields";
import type {
  DataSource,
  AddArgs,
  UpdateArgs,
  DocumentArgs,
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
  constructor(rootPath: string) {
    this.rootPath = rootPath;

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
    const { data } = await readFile<Settings>(
      p.join(this.rootPath, ".tina/settings.yml")
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
    const res = await fs.readFileSync(fullPath).toString();
    const { content, data } = matter(res);

    return {
      content,
      data,
    };
  };
  getTemplateForDocument = async (args: DocumentArgs) => {
    const sectionData = await this.getSettingsForSection(args.section);
    if (!sectionData) {
      throw new Error(`No section found for ${args.section}`);
    }
    const fullPath = p.join(this.rootPath, ".tina/front_matter/templates");
    const templates = await fs.readdirSync(fullPath);

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
    const templates = await fs.readdirSync(fullPath);
    const template = templates.find((templateBasename) => {
      return templateBasename === `${slug}.yml`;
    });
    if (!template) {
      throw new Error(`No template found for slug ${slug}`);
    }
    const { data } = await readFile<RawTemplate>(p.join(fullPath, template));

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
    await fs.outputFile(p.join(this.rootPath, path), "---");
    const string = "---\n" + jsyaml.dump(updatedTemplateData);
    await fs.outputFile(p.join(fullPath, `${template}.yml`), string);
  };
  updateDocument = async ({ relativePath, section, params }: UpdateArgs) => {
    const sectionData = await this.getSettingsForSection(section);
    if (!sectionData) {
      throw new Error(`No section found for ${section}`);
    }
    const fullPath = p.join(this.rootPath, sectionData.path, relativePath);
    const string = matter.stringify("", params.data);
    await fs.outputFile(fullPath, string);
  };
}

const readFile = async <T>(path: string): Promise<T> => {
  const extension = p.extname(path);

  switch (extension) {
    case ".yml":
      const res = await fs.readFileSync(path);
      return parseMatter(res);
    default:
      throw new Error(`Unable to parse file, unknown extension ${extension}`);
  }
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
  // console.log(template);
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
