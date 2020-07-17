import { NumberField } from "../datasources/datasource";
import { number } from "./number";

const mockField: NumberField = {
  label: "Field Label",
  name: "Field Name",
  type: "number",
};
const mockFMT = "MockFmt";

describe("Number Field", () => {
  describe("Getter", () => {
    test("should get GraphQL 'Int' when not required", () => {
      const field = number({ fmt: mockFMT, field: mockField });
      expect(field.getter.type.toString()).toBe("Int");
    });

    test("should get GraphQL 'Int!' when required", () => {
      const field = number({
        fmt: mockFMT,
        field: { ...mockField, config: { required: true } },
      });
      expect(field.getter.type.toString()).toEqual("Int!");
    });
  });

  describe("Setter", () => {
    test("resolves to the correct object", () => {
      const field = number({ fmt: mockFMT, field: mockField });
      const resolved = field.setter.resolve();
      expect(resolved.name).toEqual("Field Name");
      expect(resolved.label).toEqual("Field Label");
      expect(resolved.component).toEqual("number");
    });
  });

  describe("Mutator", () => {
    test("is the right type", () => {
      const field = number({ fmt: mockFMT, field: mockField });
      expect(field.mutator.type.toString()).toEqual("Int");
    });
  });
});
