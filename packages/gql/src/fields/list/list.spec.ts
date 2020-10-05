import { list } from ".";
import { assertType, testCache, gql } from "../test-util";

describe("List", () => {
  describe("builders", () => {
    test("builds the expected field schema", async () => {
      const result = await list.build.field({
        cache: testCache({}),
        field: {
          name: "cta",
          label: "Cta",
          type: "list",
          config: {
            use_select: false,
          },
        },
      });

      assertType(result).matches(gql`
        type ListField {
          name: String
          label: String
          component: String
          field: ListFormFieldItemField
        }

        union ListFormFieldItemField = SelectField | TextField

        type SelectField {
          component: String
          options: [String]
        }

        type TextField {
          component: String
        }
      `);
    });
  });
});
