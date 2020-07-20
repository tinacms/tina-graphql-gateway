import { TextareaField } from "../datasources/datasource";
import { textarea } from "./textarea";

const mockField: TextareaField = {
  label: "Field Label",
  name: "Field Name",
  default: "Field Default",
  type: "textarea",
  config: {
    required: false,
    wysiwyg: false,
    schema: { format: "markdown" },
  },
};
const mockFMT = "MockFmt";

describe("TextArea Field", () => {
  describe("Getter", () => {
    test("should get GraphQL 'String' when not required", () => {
      const field = textarea({ fmt: mockFMT, field: mockField });
      expect(field.getter.type.toString()).toBe("String");
    });

    test("should get GraphQL 'String!' when required", () => {
      mockField.config.required = true;
      const field = textarea({
        fmt: mockFMT,
        field: mockField,
      });
      expect(field.getter.type.toString()).toEqual("String!");
    });
  });

  describe("Setter", () => {
    test("resolves to the correct object", () => {
      const field = textarea({ fmt: mockFMT, field: mockField });
      const resolved = field.setter.resolve();
      expect(resolved.name).toEqual("Field Name");
      expect(resolved.label).toEqual("Field Label");
      expect(resolved.component).toEqual("textarea");
    });
  });

  describe("Mutator", () => {
    test("is the right type", () => {
      const field = textarea({ fmt: mockFMT, field: mockField });
      expect(field.mutator.type.toString()).toEqual("String");
    });
  });
});
