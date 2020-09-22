import { select } from ".";
import { assertType, testCache, gql } from "../test-util";

describe("Select", () => {
  describe("builders", () => {
    test("builds the expected field schema", async () => {
      const result = await select.build.field({
        cache: testCache({}),
        // FIXME: need to look at these types a little more
        field: {
          name: "role",
          label: "role",
          type: "select" as const,
          config: {
            options: ["CEO", "CTO", "COO", "CFO"],
            source: { type: "simple" },
          },
        },
      });

      assertType(result).matches(gql`
        type SelectFormField {
          name: String
          label: String
          component: String
          options: [String]
        }
      `);
    });
  });
});
