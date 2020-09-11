import { schemaBuilder } from "./schema-builder";
import { graphqlInit } from "./graphql";

import type { Field, DocumentSummary } from "./datasources/datasource";

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

describe("Document Resolver", () => {
  test("Receives a path and returns the request document object", async () => {
    const query = `query($path: String!) {
      document(path: $path) {
        __typename
        ...on Post {
          content
          data {
            title
            author {
              data {
                name
              }
            }
            sections {
              ...on Section {
                description
              }
            }
          }
        }
      }
    }`;

    const mockGetData = jest.fn(
      ({ path }): DocumentSummary => {
        if (path === "some-path.md") {
          const fields: { [key: string]: Field } = {};
          postTemplate.fields.forEach((field) => (fields[field.name] = field));
          return {
            _template: postTemplate.label,
            _fields: {
              data: fields,
              content: { type: "textarea", name: "content", label: "Content" },
            },
            data: {
              title: "Some Title",
              author: "/path/to/author.md",
              sections: [
                {
                  description: "Some textarea description",
                },
              ],
            },
            content: "Some Content",
          };
        }
        if (path === "/path/to/author.md") {
          const fields: { [key: string]: Field } = {};
          authorTemplate.fields.forEach(
            (field) => (fields[field.name] = field)
          );
          return {
            _template: authorTemplate.label,
            _fields: {
              data: fields,
              content: { type: "textarea", name: "content", label: "Content" },
            },
            data: {
              name: "Homer Simpson",
            },
            content: "Some Content",
          };
        }

        throw `No path mock for ${path}`;
      }
    );

    const MockDataSource = () => {
      return { getData: mockGetData };
    };

    const mockGetTemplates = jest.fn(() => {
      return [postTemplate, authorTemplate, sectionTemplate];
    });
    const mockGetTemplate = jest.fn((slug) => {
      if (slug === "Sections") {
        return sectionTemplate;
      } else {
        return authorTemplate;
      }
    });

    const MockSchemaSource = () => {
      return { getTemplates: mockGetTemplates, getTemplate: mockGetTemplate };
    };

    const res = await graphqlInit({
      schema: schemaBuilder({ schemaSource: MockSchemaSource() }),
      source: query,
      contextValue: { datasource: MockDataSource() },
      variableValues: { path: "some-path.md" },
    });

    expect(mockGetTemplates).toHaveBeenCalled();
    expect(mockGetData).toHaveBeenCalledWith({ path: "some-path.md" });
    expect(mockGetData).toHaveBeenCalledWith({ path: "/path/to/author.md" });

    expect(res).toMatchObject({
      data: {
        document: {
          __typename: "Post",
          content: "Some Content",
          data: {
            title: "Some Title",
            author: {
              data: {
                name: "Homer Simpson",
              },
            },
            sections: [{ description: "Some textarea description" }],
          },
        },
      },
    });
  });
});
