import { BlocksField } from "../../datasources/datasource";
import { FieldData } from "../types";
import { GraphQLObjectType } from "graphql";
import { baseInputFields } from "../inputTypes";
import { getBlocksFieldInputType } from "../blocks";
import { queryMatchesType } from "./utils";

describe("Blocks Field", () => {
  const mockBlockField: BlocksField = {
    name: "mockBlock",
    type: "blocks",
    label: "MockBlock",
    template_types: ["template1", "template2"],
  };

  describe("Getter", () => {});

  describe("Setter", () => {
    describe("Input Type", () => {
      const mockFieldData: Partial<FieldData> = {
        templateFormObjectTypes: {
          template1: new GraphQLObjectType({
            name: "Template1",
            fields: { ...baseInputFields },
          }),
          template2: new GraphQLObjectType({
            name: "Template2",
            fields: { ...baseInputFields },
          }),
        },
      };
      const inputField: GraphQLObjectType = getBlocksFieldInputType(
        mockBlockField,
        mockFieldData as FieldData
      );

      test("should get the correct typename", () => {
        expect(inputField.name).toBe("MockBlockFieldConfig");
      });

      test("should be the expected format", async () => {
        expect(
          await queryMatchesType(
            inputField,
            `{ 
              name, 
              templates { 
                Template1 { name }
                Template2 { description }
               }  
              }`
          )
        ).toBe(true);
      });
    });
  });
  describe("Mutator", () => {});
});
