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
          __namespace: "Somenamespace",
          type: "field_group_list" as const,
          fields: [
            {
              name: "header",
              label: "Header",
              type: "textarea" as const,
              __namespace: "SomenamespaceCta",
            },
          ],
        },
      });

      assertType(result).matches(gql`
        type SomenamespaceCtaGroupListField {
          name: String
          label: String
          component: String
          fields: [CtaFormFields]
        }

        union CtaFormFields = TextareaField

        type TextareaField {
          name: String
          label: String
          component: String
          description: String
        }
      `);
    });
  });
});
