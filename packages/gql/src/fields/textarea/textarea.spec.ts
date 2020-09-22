import { textarea } from ".";
import { assertType, testCache, gql } from "../test-util";

describe("Text", () => {
  describe("builders", () => {
    test("builds the expected field schema", () => {
      const result = textarea.build.field({
        cache: testCache({}),
        field: { name: "name", label: "Name", type: "textarea" as const },
      });

      assertType(result).matches(gql`
        type TextareaFormField {
          name: String
          label: String
          component: String
          description: String
        }
      `);
    });
  });
});
