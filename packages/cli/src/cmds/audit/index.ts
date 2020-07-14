import Ajv from "ajv";
import YAML from "yaml";
import fs from "fs";
import path from "path";
import { neutralText, successText, dangerText } from "../../utils/theme";
import { ForestryFMTSchema } from "./schema/fmt";
import { ForestrySettingsSchema } from "./schema/settings";

export async function audit() {
  var ajv = new Ajv({ allErrors: true, verbose: true });
  const fmtDirPath = path.resolve(
    process.cwd() + "/.forestry/front_matter/templates"
  );

  validateFile(
    process.cwd(),
    ".forestry/settings.yml",
    ForestrySettingsSchema,
    ajv
  );

  // Store these schemas for now, VSCode uses them locally
  await fs.writeFileSync(
    __dirname + "/../src/cmds/audit/output/forestrySettingsSchema.json",
    JSON.stringify(ForestrySettingsSchema, null, 2)
  );
  await fs.writeFileSync(
    __dirname + "/../src/cmds/audit/output/forestryFMTSchema.json",
    JSON.stringify(ForestryFMTSchema, null, 2)
  );

  const fmts = await fs.readdirSync(fmtDirPath);
  await Promise.all(
    fmts.map(async (fmtPath) => {
      await validateFile(fmtDirPath, fmtPath, ForestryFMTSchema, ajv);
    })
  );
}

const validateFile = async (fmtDirPath, fmtPath, schema, ajv) => {
  const fmtFullPath = fmtDirPath + "/" + fmtPath;
  const fmtString = await fs.readFileSync(fmtFullPath).toString();
  if (typeof fmtString !== "string") {
    throw "Expected a string";
  }
  const fmt = YAML.parse(fmtString);
  var validate = ajv.compile(schema);
  var valid = validate(fmt);
  if (!valid) {
    console.log(`${fmtPath} is ${dangerText("invalid")}`);
    printErrors(validate.errors);
  } else {
    console.log(`${fmtPath} is ${successText("valid")}`);
  }
};

const printErrors = (errors) => {
  errors.map((error) => {
    const handler = keywordError[error.keyword];
    handler(error);
  });
};

const keywordError = {
  required: (error) => {
    console.log(`${error.dataPath} ${error.message}`);
  },
  const: (error) => {
    console.log(`Unanticipated error - ${error.keyword}`);
    console.log(error);
  },
  additionalProperties: (error) => {
    console.log(
      `${neutralText(
        error.dataPath
      )} contains an additional property ${dangerText(
        error.params.additionalProperty
      )}`
    );
  },
  anyOf: (error) => {
    console.log(`Unanticipated error - ${error.keyword}`);
    console.log(error);
  },
  oneOf: (error) => {
    console.log(`Unanticipated error - ${error.keyword}`);
    console.log(error);
  },
  enum: (error) => {
    console.log(
      `${neutralText(error.dataPath)} ${error.message} but got ${dangerText(
        error.data
      )}.
    Allowed values: ${successText(error.schema.join(", "))}
`
    );
  },
  type: (error) => {
    console.log(
      `${neutralText(error.dataPath)} ${error.message.replace(
        "should be",
        "should be of type"
      )} but got ${dangerText(displayType(error))}
`
    );
  },
  if: () => {
    // an error stating should match "then" schema
    // indicates that the conditional schema isn't matched -
    // we should get a more specific error elsewhere so ignore these
    // unless debugging.
  },
};

const displayType = (error) => {
  if (error.data === null) {
    return "null";
  } else {
    return `${typeof error.data} (${error.data})`;
  }
};
