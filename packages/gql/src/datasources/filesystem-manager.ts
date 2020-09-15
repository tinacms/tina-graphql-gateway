import p from "path";
import fs from "fs";
import _ from "lodash";
import matter from "gray-matter";

export const FilesystemDataSource = (projectRoot: string) => {
  return {
    getTemplatesForSection: async (section: string) => {
      const fullPath = p.join(projectRoot, ".tina/settings.yml");
      const res = await fs.readFileSync(fullPath).toString();
      const { data } = matter(res);

      let templates;
      if (section) {
        templates = data.sections.find((templateSection) => {
          return _.lowerCase(_.kebabCase(templateSection.label)) === section;
        }).templates;
      } else {
        templates = _.flatten(data.sections.map(({ templates }) => templates));
      }
      return Promise.all(
        templates.map(async (templateBasename) => {
          const fullPath = p.join(
            projectRoot,
            ".tina/front_matter/templates",
            `${templateBasename}.yml`
          );
          const res = await fs.readFileSync(fullPath).toString();
          const { data } = matter(res);
          return data;
        })
      );
    },
    getData: async ({ path }: { path: string }) => {
      const fullPath = p.join(projectRoot, path);
      const res = await fs.readFileSync(fullPath).toString();
      const { content, data } = matter(res);

      return {
        content,
        data,
      };
    },
    getTemplateForDocument: async (args: { path: string }) => {
      const fullPath = p.join(projectRoot, ".tina/front_matter/templates");
      const templates = await fs.readdirSync(fullPath);
      const template = (
        await Promise.all(
          templates.map(async (template) => {
            const res = await fs
              .readFileSync(p.join(fullPath, template))
              .toString();
            const { data } = matter(res);

            if (data.pages?.includes(args.path)) {
              return data;
            }
          })
        )
      ).filter(Boolean)[0];

      return template;
    },
    getTemplate: async ({ slug }: { slug: string }) => {
      const fullPath = p.join(projectRoot, ".tina/front_matter/templates");
      const templates = await fs.readdirSync(fullPath);
      const template = templates.find((templateBasename) => {
        return templateBasename === `${slug}.yml`;
      });
      const res = await fs.readFileSync(p.join(fullPath, template)).toString();
      const { data } = matter(res);

      return data;
    },
  };
};
