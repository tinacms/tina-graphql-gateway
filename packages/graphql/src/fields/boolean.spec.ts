import { BooleanField } from "../datasources/datasource";
import { boolean } from "./boolean";

const mockField: BooleanField = {
  label: "Field Label",
  name: "Field Name",
  type: "boolean",
};
const mockFMT = "MockFmt";

describe("Text Field", () => {
  describe("Getter", () => {
    test("should get GraphQL 'String' when not required", () => {
      const field = boolean({ fmt: mockFMT, field: mockField });
      expect(field.getter.type.toString()).toBe("Boolean");
    });

    test("should get GraphQL 'String!' when required", () => {
      const field = boolean({
        fmt: mockFMT,
        field: { ...mockField, config: { required: true } },
      });
      expect(field.getter.type.toString()).toEqual("Boolean!");
    });
  });

  describe("Setter", () => {
    test("resolves to the correct object", () => {
      const field = boolean({ fmt: mockFMT, field: mockField });
      const resolved = field.setter.resolve();
      expect(resolved.name).toEqual("Field Name");
      expect(resolved.label).toEqual("Field Label");
      expect(resolved.component).toEqual("toggle");
    });
  });

  describe("Mutator", () => {
    test("is the right type", () => {
      const field = boolean({ fmt: mockFMT, field: mockField });
      expect(field.mutator.type.toString()).toEqual("Boolean");
    });
  });
});
