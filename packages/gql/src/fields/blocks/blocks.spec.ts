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
          fields: [
            {
              name: "name",
              label: "Name",
              type: "textarea" as const,
            },
          ],
        };
      });
      const result = await blocks.build.field({
        cache: testCache({ mockGetTemplate: mockGetTemplate }),
        field: {
          name: "sections",
          type: "blocks" as const,
          label: "Sections",
          template_types: ["section"],
        },
      });

      expect(mockGetTemplate).toHaveBeenCalledWith({ slug: "section" });
      assertType(result).matches(gql`
        type BlocksSection {
          name: String
          label: String
          component: String
          templates: BlocksSectionTemplates
        }

        type BlocksSectionTemplates {
          sectionTemplateFields: SectionForm
        }

        type SectionForm {
          fields: [SectionFormFields]
        }

        union SectionFormFields = TextareaFormField

        type TextareaFormField {
          name: String
          label: String
          component: String
          description: String
        }
      `);
    });
    test("multiple block field definitions don't collide", async () => {
      const mockGetTemplate = jest.fn(() => {
        return {
          label: "Section",
          fields: [
            {
              name: "name",
              label: "Name",
              type: "textarea" as const,
            },
          ],
        };
      });
      const mockGetTemplate2 = jest.fn(() => {
        return {
          label: "Section2",
          fields: [
            {
              name: "name",
              label: "Name",
              type: "textarea" as const,
            },
          ],
        };
      });
      const block1 = await blocks.build.field({
        cache: testCache({ mockGetTemplate: mockGetTemplate }),
        field: {
          name: "sections",
          type: "blocks" as const,
          label: "Sections",
          template_types: ["section"],
        },
      });
      const block2 = await blocks.build.field({
        cache: testCache({ mockGetTemplate: mockGetTemplate2 }),
        field: {
          name: "sections",
          type: "blocks" as const,
          label: "Sections",
          template_types: ["section2"],
        },
      });

      expect(mockGetTemplate).toHaveBeenCalledWith({ slug: "section" });
      expect(mockGetTemplate2).toHaveBeenCalledWith({ slug: "section2" });
      assertNoTypeCollisions([block1, block2]);
    });
  });
});
