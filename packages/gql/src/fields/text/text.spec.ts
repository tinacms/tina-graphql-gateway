import { text } from ".";
import { assertType, testCache, gql } from "../test-util";

describe("Text", () => {
  describe("builders", () => {
    test("builds the expected field schema", () => {
      const result = text.build.field({
        cache: testCache({}),
        field: { name: "name", label: "Name", type: "text" as const },
      });

      assertType(result).matches(gql`
        type TextFormField {
          name: String
          label: String
          component: String
          config: Config
        }

        type Config {
          required: String
        }
      `);
    });
  });
});
