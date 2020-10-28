import fs from "fs";
import path from "path";
import { FileSystemManager } from "../datasources/filesystem-manager";

describe("Schema builder", () => {
  test("does it", async () => {
    const projectRoot = path.join(process.cwd(), "src/fixtures/project1");

    const datasource = new FileSystemManager(projectRoot);

    const res = await datasource.getTemplate("author");

    expect(res).toMatchObject({
      label: expect.any(String),
      hide_body: expect.any(Boolean),
      fields: expect.arrayContaining([
        {
          name: expect.any(String),
          label: expect.any(String),
          type: expect.any(String),
          description: expect.any(String),
          __namespace: expect.any(String),
        },
      ]),
    });
  });
});

const meh = {
  label: "Author",
  hide_body: false,
  fields: [
    {
      name: "name",
      label: "Name",
      type: "textarea",
      description: "Your first name & last name",
      __namespace: "Author",
    },
    {
      name: "role",
      label: "role",
      type: "select",
      description: "What's your job?",
      config: [Object],
      __namespace: "Author",
    },
    {
      name: "anecdotes",
      type: "list",
      config: [Object],
      label: "Anecdotes",
      description: "Something simple about their high-level achievements",
      __namespace: "Author",
    },
    {
      name: "accolades",
      label: "Accolades",
      type: "field_group_list",
      fields: [Array],
      __namespace: "Author",
    },
  ],
  pages: ["authors/marge.md", "authors/homer.md"],
};
