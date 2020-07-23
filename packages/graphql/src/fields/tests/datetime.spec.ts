import { DateField } from "../../datasources/datasource";
import { datetime } from "../datetime";

const mockField: DateField = {
  label: "Field Label",
  name: "Field Name",
  type: "datetime",
  hidden: false,
  default: "now",
  config: {
    date_format: "MMMM DD YYYY",
    export_format: "MMMM DD YYYY",
    required: false,
  },
};
const mockFMT = "MockFmt";

describe("DateTime Field", () => {
  describe("Getter", () => {
    test("should get GraphQL 'String' when not required", () => {
      const field = datetime({ fmt: mockFMT, field: mockField });
      expect(field.getter.type.toString()).toBe("String");
    });

    test("should get GraphQL 'String!' when required", () => {
      mockField.config.required = true;
      const field = datetime({
        fmt: mockFMT,
        field: mockField,
      });
      expect(field.getter.type.toString()).toEqual("String!");
    });
  });

  describe("Setter", () => {
    test("resolves to the correct object", () => {
      const field = datetime({ fmt: mockFMT, field: mockField });
      const resolved = field.setter.resolve();
      expect(resolved.name).toEqual("Field Name");
      expect(resolved.label).toEqual("Field Label");
      expect(resolved.component).toEqual("date");
    });
  });

  describe("Mutator", () => {
    test("is the right type", () => {
      const field = datetime({ fmt: mockFMT, field: mockField });
      expect(field.mutator.type.toString()).toEqual("String");
    });
  });
});
