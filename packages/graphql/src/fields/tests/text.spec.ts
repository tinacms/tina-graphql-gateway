import { TextField } from "../../datasources/datasource";
import { text } from "../text";

const mockField: TextField = {
  label: "Field Label",
  name: "Field Name",
  default: "Field Default",
  type: "text",
};
const mockFMT = "MockFmt";

describe("Text Field", () => {
  describe("Getter", () => {
    test("should get GraphQL 'String' when not required", () => {
      const field = text({ fmt: mockFMT, field: mockField });
      expect(field.getter.type.toString()).toBe("String");
    });

    test("should get GraphQL 'String!' when required", () => {
      const field = text({
        fmt: mockFMT,
        field: { ...mockField, config: { required: true } },
      });
      expect(field.getter.type.toString()).toEqual("String!");
    });
  });

  describe("Setter", () => {
    test("resolves to the correct object", () => {
      const field = text({ fmt: mockFMT, field: mockField });
      const resolved = field.setter.resolve();
      expect(resolved.name).toEqual("Field Name");
      expect(resolved.label).toEqual("Field Label");
      expect(resolved.component).toEqual("text");
    });
  });

  describe("Mutator", () => {
    test("is the right type", () => {
      const field = text({ fmt: mockFMT, field: mockField });
      expect(field.mutator.type.toString()).toEqual("String");
    });
  });
});
