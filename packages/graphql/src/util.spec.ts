import * as utils from "./util";

import { DirectorySection, Section, Settings } from "./datasources/datasource";

import { GraphQLObjectType } from "graphql";
import { Templates } from "./fields/types";
import { baseInputFields } from "./fields";

describe("shortFMTName", () => {
  test("it should remove the extension", () => {
    const input = "action-newsletter.yml";
    const output = "action-newsletter";
    expect(utils.shortFMTName(input)).toEqual(output);
  });
  test("it should remove the FMT base path", () => {
    const input = `${utils.FMT_BASE}/action-newsletter.yml`;
    const output = "action-newsletter";
    expect(utils.shortFMTName(input)).toEqual(output);
  });
});

describe("friendlyName", () => {
  test("it should convert to CamelCase", () => {
    const input = "action-newsletter.yml";
    const output = "ActionNewsletter";
    expect(utils.friendlyName(input)).toEqual(output);
  });
  test("it should add suffix", () => {
    const input = "action-newsletter.yml";
    const output = "ActionNewsletterSuffix";
    expect(utils.friendlyName(input, { suffix: "suffix" })).toEqual(output);
  });
});

describe("slugify", () => {
  test("should be able to slugify", () => {
    const input = "Slugify Test";
    const output = "slugify-test";
    expect(utils.slugify(input)).toEqual(output);
  });
});

describe("getSectionFmtTypes", () => {
  let mockTemplates: Templates = {
    template1: new GraphQLObjectType({
      name: "Template1",
      fields: { ...baseInputFields },
    }),
    template2: new GraphQLObjectType({
      name: "Template2",
      fields: { ...baseInputFields },
    }),
  };

  let mockSettings: Partial<Settings> = {
    data: {
      sections: [
        { type: "directory", templates: ["template1"] } as Section,
        { type: "directory", templates: ["template2"] } as Section,
        { type: "heading", label: "label1" } as Section,
      ],
    },
  };

  test("should get only types that correspond to a directory section", () => {
    expect(
      utils
        .getSectionFmtTypes(mockSettings as Settings, mockTemplates)
        .toString()
    ).toEqual("Template1,Template2");
  });
});

describe("isDirectorySection", () => {
  test("should be able to identitify Directory sections", () => {
    const mockSection: Partial<Section> = { type: "directory" };
    expect(utils.isDirectorySection(mockSection as Section)).toEqual(true);
  });

  test("should be able to identitify non Directory sections", () => {
    const mockSection: Partial<Section> = { type: "heading" };
    expect(utils.isDirectorySection(mockSection as Section)).toEqual(false);
  });
});
