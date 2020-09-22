import { blocks } from ".";
import { assertType, testCache, gql } from "../test-util";

describe("Blocks", () => {
  describe("builders", () => {
    test("builds the expected field schema", async () => {
      const field = {
        name: "sections",
        type: "blocks" as const,
        label: "Sections",
        template_types: ["section"],
      };

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
        field,
      });

      expect(mockGetTemplate).toHaveBeenCalledWith({ slug: "section" });
      assertType(result).matches(gql`
        type BlocksFormField {
          name: String
          label: String
          component: String
          templates: BlocksTemplates
        }

        type BlocksTemplates {
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
          config: Config
        }

        type Config {
          required: String
        }
      `);
    });
  });
});
