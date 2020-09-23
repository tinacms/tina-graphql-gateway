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
          type: "list" as const,
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

        union ListFormFieldItemField = SelectField | TextareaField

        type SelectField {
          component: String
          options: [String]
        }

        type TextareaField {
          component: String
        }
      `);
    });
  });
});
