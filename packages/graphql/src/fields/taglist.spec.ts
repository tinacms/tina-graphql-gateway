import { TagListField } from "../datasources/datasource";
import { tag_list } from "./taglist";

const mockField: TagListField = {
  label: "Field Label",
  name: "Field Name",
  default: ["tag1", "tag2"],
  type: "tag_list",
};
const mockFMT = "MockFmt";

describe("TagList Field", () => {
  describe("Getter", () => {
    test("should get GraphQL '[String]' when not required", () => {
      const field = tag_list({ fmt: mockFMT, field: mockField });
      expect(field.getter.type.toString()).toBe("[String]");
    });

    // test("should get GraphQL 'String!' when required", () => {
    //   const field = tag_list({
    //     fmt: mockFMT,
    //     field: { ...mockField, config: { required: true } },
    //   });
    //   expect(field.getter.type.toString()).toEqual("[String]!");
    // });
  });

  describe("Setter", () => {
    test("resolves to the correct object", () => {
      const field = tag_list({ fmt: mockFMT, field: mockField });
      const resolved = field.setter.resolve();
      expect(resolved.name).toEqual("Field Name");
      expect(resolved.label).toEqual("Field Label");
      expect(resolved.component).toEqual("tags");
    });
  });

  describe("Mutator", () => {
    test("is the right type", () => {
      const field = tag_list({ fmt: mockFMT, field: mockField });
      expect(field.mutator.type.toString()).toEqual("[String]");
    });
  });
});
