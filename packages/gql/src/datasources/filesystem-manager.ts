import type { DataSource } from "./datasource";
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
    getTemplates: async (section: string) => {
      if (section) {
        if (section === "Author") {
          return [authorTemplate];
        }
        if (section === "Section") {
          return [sectionTemplate];
        }
        throw new Error("Gotta define the right section temlpate");
      } else {
        return [postTemplate, authorTemplate, sectionTemplate];
      }
    },
    getData: async ({ path }: { path: string }) => {
      if (path === "some-path.md") {
        return {
          data: {
            title: "Some Title",
            author: "/path/to/author.md",
            sections: [
              {
                template: "section",
                description: "Some textarea description",
              },
            ],
          },
          content: "Some Content",
        };
      }
      if (path === "/path/to/author.md") {
        return {
          data: {
            name: "Homer Simpson",
          },
          content: "Some Content",
        };
      }

      throw `No path mock for ${path}`;
    },
    getTemplateForDocument: async (args: { path: string }) => {
      if (args.path === "some-path.md") {
        return postTemplate;
      }

      if (args.path === "/path/to/author.md") {
        return authorTemplate;
      }

      throw `No template mock for ${args}`;
    },
    getTemplate: async ({ slug }: { slug: string }) => {
      if (slug === "section") {
        return sectionTemplate;
      }

      throw new Error(`no template for ${slug}`);
    },
  };
};
