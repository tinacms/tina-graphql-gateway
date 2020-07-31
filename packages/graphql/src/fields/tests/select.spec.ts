import * as utilModule from "../../util";

import {
  ConfigType,
  FieldContextType,
  FieldData,
  TemplatePage,
} from "../types";
import {
  Content,
  DataSource,
  SectionSelect,
} from "../../datasources/datasource";
import {
  getSectionSelectFieldResolver,
  setSectionSelectFieldResolver,
} from "../select";

import { GraphQLError } from "graphql";

const mockDataSource: DataSource = {
  getData: jest.fn(),
  getSettings: jest.fn(),
  getTemplate: jest.fn(),
  getTemplateList: jest.fn(),
  writeData: jest.fn(),
  deleteContent: jest.fn(),
  createContent: jest.fn(),
};

describe("Section Select Field", () => {
  // TODO: How do I do mocks with TS?
  let mockField: Partial<SectionSelect> = {
    name: "field",
    label: "Field",
  };
  let mockFieldData: Partial<FieldData> = {};

  describe("Setter", () => {
    describe("Resolver", () => {
      test("should return simple select field when not for pages", async () => {
        const resolved = await setSectionSelectFieldResolver(
          mockField as SectionSelect,
          mockFieldData as FieldData
        );

        expect(resolved.name).toEqual("field");
        expect(resolved.label).toEqual("Field");
        expect(resolved.component).toEqual("select");
      });

      test("should return the pages as the options when pages types", async () => {
        mockField = {
          ...mockField,
          config: {
            required: true,
            source: {
              type: "pages",
              section: "test",
              file: "test",
              path: "test",
            },
          },
        };
        const spy = jest.spyOn(utilModule, "getPagesForSection");
        spy.mockReturnValue(["page1", "page2"]);

        const resolved = await setSectionSelectFieldResolver(
          mockField as SectionSelect,
          mockFieldData as FieldData
        );
        expect(resolved.options).toContain("page1");
        expect(resolved.options).toContain("page2");
        expect(resolved.component).toContain("select");
      });
    });
  });

  describe("Getter", () => {
    let mockField: Partial<SectionSelect> = {
      name: "field",
      label: "Field",
    };
    let mockVal: { [key: string]: unknown } = { field: null };
    let mockCtx: FieldContextType = {
      dataSource: mockDataSource,
    };
    let mockFieldData: Partial<FieldData> = {
      templatePages: [{ name: "pages1", pages: ["page1", "page2"] }],
    };
    let mockConfig: ConfigType = {
      rootPath: "rootPath",
      siteLookup: "siteLookup",
    };

    describe("Resolver", () => {
      test("should throw error with invalid path", async () => {
        try {
          await getSectionSelectFieldResolver(
            mockField as SectionSelect,
            mockVal,
            mockCtx,
            mockFieldData as FieldData,
            mockConfig
          );
        } catch (e) {
          expect(e).toBeInstanceOf(GraphQLError);
        }
      });

      test("Does a thing", async () => {
        mockVal["field"] = "a/fake/path";

        const spy = jest.spyOn(utilModule, "getFmtForDocument");
        spy.mockReturnValue({
          name: "template-name",
          pages: ["page1", "page2"],
        });

        const resolved = await getSectionSelectFieldResolver(
          mockField as SectionSelect,
          mockVal,
          mockCtx,
          mockFieldData as FieldData,
          mockConfig
        );

        expect(resolved.path).toEqual("a/fake/path");
        expect(resolved.template).toEqual("template-name");
      });
    });
  });
});

describe("Document Select Field", () => {
  describe("Setter", () => {});
  describe("Getter", () => {});
});
