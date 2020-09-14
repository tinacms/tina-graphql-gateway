import p from "path";
import fs from "fs";
import _ from "lodash";
import matter from "gray-matter";

const postTemplate = {
  label: "Post",
  hide_body: false,
  fields: [
    {
      type: "textarea" as const,
      label: "Title",
      name: "title",
    },
    {
      type: "select" as const,
      label: "Author",
      name: "author",
      config: {
        source: "documents" as const,
        section: "authors",
      },
    },
    {
      type: "blocks" as const,
      label: "Sections",
      name: "sections",
      template_types: ["section"],
    },
  ],
};
const authorTemplate = {
  label: "Author",
  hide_body: false,
  fields: [
    {
      type: "textarea" as const,
      label: "Name",
      name: "name",
    },
  ],
};
const sectionTemplate = {
  label: "Section",
  hide_body: false,
  fields: [
    {
      type: "textarea" as const,
      label: "Description",
      name: "description",
    },
  ],
};

export const FilesystemDataSource = (projectRoot: string) => {
  return {
    getTemplatesForSection: async (section: string) => {
      const fullPath = p.join(projectRoot, ".tina/settings.yml");
      const res = await fs.readFileSync(fullPath).toString();
      const { data } = matter(res);

      if (section) {
        if (section === "author") {
          return [authorTemplate];
        }
        if (section === "section") {
          return [sectionTemplate];
        }
        throw new Error("Gotta define the right section temlpate");
      } else {
        const templates = _.flatten(
          data.sections.map(({ templates }) => templates)
        );
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
      }
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
