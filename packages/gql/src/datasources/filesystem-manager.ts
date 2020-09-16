import p from "path";
import fs from "fs";
import _ from "lodash";
import matter from "gray-matter";
import { byTypeWorks } from "../types";
import type { Settings, Template, TemplateData } from "../types";
import type { DataSource } from "./datasource";

export const FilesystemDataSource = (projectRoot: string): DataSource => {
  return {
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
          return data;
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

      return template;
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

      return data;
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
