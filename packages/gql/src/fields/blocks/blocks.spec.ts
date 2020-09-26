import { blocks } from ".";
import {
  assertType,
  assertNoTypeCollisions,
  testCache,
  gql,
} from "../test-util";

describe("Blocks", () => {
  describe("builders", () => {
    test("builds the expected field schema", async () => {
      const mockGetTemplate = jest.fn(() => {
        return {
          label: "Section",
          __namespace: "SomeTemplate",
          fields: [
            {
              __namespace: "SomeTemplateSection",
              name: "name",
              label: "Name",
              type: "textarea",
            },
          ],
        };
      });
      const result = await blocks.build.field({
        cache: testCache({ mockGetTemplate: mockGetTemplate }),
        field: {
          name: "sections",
          type: "blocks",
          label: "Sections",
          __namespace: "SomeTemplate",
          template_types: ["section"],
        },
      });

      expect(mockGetTemplate).toHaveBeenCalledWith({ slug: "section" });
      assertType(result).matches(gql`
        type SomeTemplateSectionsBlocksField {
          name: String
          label: String
          component: String
          templates: SomeTemplateSectionsBlocksFieldTemplates
        }

        type SomeTemplateSectionsBlocksFieldTemplates {
          sectionTemplateFields: SectionForm
        }

        type SectionForm {
          fields: [SomeTemplateSectionFormFields]
        }

        union SomeTemplateSectionFormFields = TextareaField

        type TextareaField {
          name: String
          label: String
          component: String
          description: String
        }
      `);
    });
    test("multiple block field definitions don't collide", async () => {
      const mockGetTemplate = jest.fn(({ slug }) => {
        if (slug === "section") {
          return {
            label: "Section",
            fields: [
              {
                name: "name",
                label: "Name",
                type: "textarea",
              },
            ],
          };
        } else {
          return {
            label: "Section2",
            fields: [
              {
                name: "name",
                label: "Name",
                type: "textarea",
              },
            ],
          };
        }
      });
      const cache = testCache({ mockGetTemplate });
      const block1 = await blocks.build.field({
        cache,
        field: {
          name: "sections",
          type: "blocks",
          label: "Sections",
          template_types: ["section"],
          __namespace: "SomeTemplate2",
        },
      });
      const block2 = await blocks.build.field({
        cache,
        field: {
          name: "sections",
          type: "blocks",
          label: "Sections",
          __namespace: "SomeTemplate",
          template_types: ["section2"],
        },
      });

      expect(mockGetTemplate).toHaveBeenCalledWith({ slug: "section" });
      expect(mockGetTemplate).toHaveBeenCalledWith({ slug: "section2" });
      assertNoTypeCollisions([block1, block2]);
    });
  });
});