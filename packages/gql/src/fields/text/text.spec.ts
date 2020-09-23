import { text } from ".";
import { assertType, testCache, gql } from "../test-util";

describe("Text", () => {
  describe("builders", () => {
    test("builds the expected field schema", () => {
      const result = text.build.field({
        cache: testCache({}),
        field: {
          name: "name",
          label: "Name",
          type: "text",
          __namespace: "SomeTemplate",
        },
      });

      assertType(result).matches(gql`
        type TextField {
          name: String
          label: String
          component: String
        }
      `);
    });
  });
});
