import { BlocksField, FieldType } from "../../datasources/datasource";
import {
  GraphQLObjectType,
  GraphQLObjectTypeConfig,
  GraphQLSchema,
  graphql,
} from "graphql";

import { FieldData } from "../types";
import { baseInputFields } from "../inputFields";
import { getBlocksInputField } from "../blocks";

const queryMatchesType = async (gqlType: GraphQLObjectType, query: string) => {
  const schema = new GraphQLSchema({ query: gqlType });
  return await graphql(schema, query).then((result) => {
    if (result.errors) return false;
    return true;
  });
};

describe("Blocks Field", () => {
  describe("Blocks input field", () => {
    test("a thing", () => {
      const mockBlockField: BlocksField = {
        name: "actions",
        type: "blocks",
        label: "Action",
        template_types: ["action-video"],
      };

      const mockFieldData: Partial<FieldData> = {
        templateFormObjectTypes: {
          "action-video": new GraphQLObjectType({
            name: "MockObject",
            fields: { ...baseInputFields },
          }),
        },
      };

      const inputField: GraphQLObjectType = getBlocksInputField(
        mockBlockField,
        mockFieldData as FieldData
      );

      queryMatchesType(
        inputField,
        "{ name, label, description, component, templates { MockObject { name, label, description, component } }  }"
      ).then((result) => expect(result).toBe(true));
    });
  });
});
