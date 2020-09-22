import { fieldGroupList } from ".";
import { assertType, testCache, gql } from "../test-util";

describe("Field Group List", () => {
  describe("builders", () => {
    test("builds the expected field schema", async () => {
      const result = await fieldGroupList.build.field({
        cache: testCache({}),
        field: {
          name: "cta",
          label: "Cta",
          type: "field_group_list" as const,
          fields: [
            {
              name: "header",
              label: "Header",
              type: "textarea" as const,
            },
          ],
        },
      });

      assertType(result).matches(gql`
        type FieldGroupListFormField {
          name: String
          label: String
          component: String
          fields: [CtaFormFields]
        }

        union CtaFormFields = TextareaFormField

        type TextareaFormField {
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
