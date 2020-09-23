import p from "path";
import fs from "fs";
import _ from "lodash";
import matter from "gray-matter";
import { byTypeWorks } from "../types";
import type { Settings, Template, TemplateData, WithFields } from "../types";
import type { DataSource } from "./datasource";
import type { Field } from "../fields";
import { FieldGroupField } from "../fields/field-group";
import { FieldGroupListField } from "../fields/field-group-list";

export const FilesystemDataSource = (projectRoot: string): DataSource => {
  return {
    getDocumentsForSection: async (section) => {
      const templates = await FilesystemDataSource(
        projectRoot
      ).getTemplatesForSection(section);
      const pages = templates.map((template) => template.pages || []);
      return _.flatten(pages);
    },
    getTemplatesForSection: async (section) => {
      const { data } = await readFile<Settings>(
        p.join(projectRoot, ".tina/settings.yml")
      );

      const templates = section
        ? data.sections
            .filter(byTypeWorks("directory"))
            .find((templateSection) => {
              const sectionSlug = _.lowerCase(
                _.kebabCase(templateSection.label)
              );
              return sectionSlug === section;
            })?.templates
        : _.flatten(
            data.sections
              .filter(byTypeWorks("directory"))
              .map(({ templates }) => templates)
          );

      if (!templates) {
        throw new Error(`No templates found for section`);
      }

      return Promise.all(
        templates.map(async (templateBasename) => {
          const fullPath = p.join(
            projectRoot,
            ".tina/front_matter/templates",
            `${templateBasename}.yml`
          );
          const { data } = await readFile<Template>(fullPath);
          return namespaceFields(data);
        })
      );
    },
    getData: async ({ path }) => {
      const fullPath = p.join(projectRoot, path);
      const res = await fs.readFileSync(fullPath).toString();
      const { content, data } = matter(res);

      return {
        content,
        data,
      };
    },
    getTemplateForDocument: async (args) => {
      const fullPath = p.join(projectRoot, ".tina/front_matter/templates");
      const templates = await fs.readdirSync(fullPath);
      const template = (
        await Promise.all(
          templates.map(async (template) => {
            const { data } = await readFile<Template>(
              p.join(fullPath, template)
            );

            if (data.pages?.includes(args.path)) {
              return data;
            } else {
              return false;
            }
          })
        )
      ).filter(Boolean)[0];

      if (!template) {
        throw new Error(`Unable to find template for document ${args.path}`);
      }
      // console.log(namespaceFields(template));

      return namespaceFields(template);
    },
    getTemplate: async ({ slug }) => {
      const fullPath = p.join(projectRoot, ".tina/front_matter/templates");
      const templates = await fs.readdirSync(fullPath);
      const template = templates.find((templateBasename) => {
        return templateBasename === `${slug}.yml`;
      });
      if (!template) {
        throw new Error(`No template found for slug ${slug}`);
      }
      const { data } = await readFile<Template>(p.join(fullPath, template));

      return namespaceFields(data);
    },
  };
};

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

function isWithFields(t: TemplateData | Field): t is WithFields {
  return t.hasOwnProperty("fields");
}

const namespaceFields = (template: TemplateData): TemplateData => {
  return {
    ...template,
    fields: template.fields.map((f) => {
      if (isWithFields(f)) {
        return {
          ...namespaceSubFields(f, template.label),
        };
      } else {
        return {
          ...f,
          __namespace: `${template.label}`,
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
          ...namespaceSubFields(f, template.label),
          __namespace: `${parentNamespace}${template.label}`,
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
