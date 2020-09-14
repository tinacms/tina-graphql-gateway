import path from "path";
import fs from "fs";
import { schemaBuilder } from "./schema-builder";
import { graphqlInit } from "./graphql";
import { FilesystemDataSource } from "./datasources/filesystem-manager";

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
              ...on Author {
                data {
                  name
                }
              }
            }
            sections {
              ...on SectionData {
                description
              }
            }
          }
        }
      }
    }`;

    const projectRoot = path.join(process.cwd(), "fixtures/project1");

    const datasource = FilesystemDataSource(projectRoot);

    const res = await graphqlInit({
      schema: await schemaBuilder({ schemaSource: datasource }),
      source: query,
      contextValue: { datasource: datasource },
      variableValues: { path: "some-path.md" },
    });
    if (res.errors) {
      console.log(res.errors);
    }

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
    // expect(mockGetTemplates).toHaveBeenCalled();
    // expect(mockGetData).toHaveBeenCalledWith({ path: "some-path.md" });
    // expect(mockGetData).toHaveBeenCalledWith({ path: "/path/to/author.md" });
  });
});
