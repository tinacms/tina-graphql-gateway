import { fieldGroup } from ".";
import {
  assertType,
  assertNoTypeCollisions,
  testCache,
  gql,
} from "../test-util";

describe("Field Group", () => {
  describe("builders", () => {
    test("builds the expected field schema", async () => {
      const result = await fieldGroup.build.field({
        cache: testCache({}),
        field: {
          name: "cta",
          label: "Cta",
          type: "field_group",
          __namespace: "SomeTemplate",
          fields: [
            {
              name: "header",
              label: "Header",
              type: "textarea",
              __namespace: "SomeTemplateCta",
            },
          ],
        },
      });

      assertType(result).matches(gql`
        type SomeTemplateCtaGroupField {
          name: String
          label: String
          component: String
          fields: [SomeTemplateCtaFormFields]
        }

        union SomeTemplateCtaFormFields = TextareaField

        type TextareaField {
          name: String
          label: String
          component: String
          description: String
        }
      `);
    });
    test("multiple definitions don't collide", async () => {
      const cache = testCache({});
      const group1 = await fieldGroup.build.field({
        cache,
        field: {
          name: "cta",
          label: "Cta",
          type: "field_group",
          __namespace: "Somenamespace",
          fields: [
            {
              name: "header",
              label: "Header",
              type: "textarea",
              __namespace: "SomenamespaceCta",
            },
          ],
        },
      });
      const group2 = await fieldGroup.build.field({
        cache,
        field: {
          name: "cta",
          label: "Cta",
          type: "field_group",
          __namespace: "Somenamespace2",
          fields: [
            {
              name: "title",
              label: "Title",
              type: "textarea",
              __namespace: "Somenamespace2Cta",
            },
          ],
        },
      });

      assertNoTypeCollisions([group1, group2]);
    });
  });
});