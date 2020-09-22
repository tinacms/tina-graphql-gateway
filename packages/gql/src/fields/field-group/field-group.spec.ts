import { fieldGroup } from ".";
import { assertType, testCache, gql } from "../test-util";

describe("Field Group", () => {
  describe("builders", () => {
    test("builds the expected field schema", async () => {
      const result = await fieldGroup.build.field({
        cache: testCache({}),
        field: {
          name: "cta",
          label: "Cta",
          type: "field_group" as const,
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
        type FieldGroupFormField {
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
