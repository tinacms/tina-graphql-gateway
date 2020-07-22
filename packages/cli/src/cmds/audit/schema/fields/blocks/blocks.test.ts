import { validator } from "../../../validator";
import { validateFile } from "../../../index";
import { BlocksField } from "./index";

const blocksDef = {
  one: {
    initial: {
      name: "blocks",
      type: "blocks",
      label: "Blocks",
      template_types: ["sidecar"],
      config: {
        min: null,
        max: null,
      },
    },
    fixed: {
      name: "blocks",
      type: "blocks",
      label: "Blocks",
      template_types: ["sidecar"],
    },
  },
};

const ajv = validator(true);
test("blocks", async () => {
  const output = await validateFile({
    fmtPath: "my-path.yml",
    payload: blocksDef.one.initial,
    schema: BlocksField,
    ajv,
    anyErrors: [],
    migrate: true,
  });

  expect(output.fmt).toEqual(blocksDef.one.fixed);
});
