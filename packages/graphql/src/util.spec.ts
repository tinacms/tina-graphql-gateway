import * as utils from "./util";

import { Section, Settings } from "./datasources/datasource";

import { GraphQLObjectType } from "graphql";
import { Templates } from "./fields/types";
import { baseInputFields } from "./fields/inputTypes";

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

// describe("getBlockFmtTypes", () => {
//   test("should convert list of string templates to list of GraphQLObjectTypes", () => {
//     const type1 = new GraphQLObjectType({ name: "Type1", fields: {} });
//     const type2 = new GraphQLObjectType({ name: "Type2", fields: {} });
//     const acceptedTypes = ["type1", "type2"];
//     const typeMapping = { type1, type2 };

//     const results = utils.getBlockFmtTypes(acceptedTypes, typeMapping);

//     expect(results[0].name).toBe("Type1");
//     expect(results[1].name).toBe("Type2");
//   });
// });
