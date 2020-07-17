import Ajv from "ajv";
import YAML from "yaml";
import fs from "fs";
import path from "path";
import { neutralText, successText, dangerText } from "../../utils/theme";
import { ForestryFMTSchema } from "./schema/fmt";
import { ForestrySettingsSchema } from "./schema/settings";
import get from "lodash.get";

const stripSlashes = (value) => {
  return value.replace(/^[^a-z\d]*|[^a-z\d]*$/gi, "");
};

export async function audit(
  _ctx,
  _next,
  {
    workingDir = "",
  }: {
    workingDir: string;
  }
) {
  const workingDirReal = workingDir.startsWith("/")
    ? workingDir
    : process.cwd() + "/" + stripSlashes(workingDir);
  var ajv = new Ajv({ allErrors: true, verbose: true });
  const fmtDirPath = path.resolve(
    workingDirReal + "/.forestry/front_matter/templates"
  );

  validateFile(
    workingDirReal,
    ".forestry/settings.yml",
    ForestrySettingsSchema,
    ajv
  );

  // Store these schemas for now, VSCode uses them locally
  // await fs.writeFileSync(
  //   path.resolve(
  //     __dirname + "/../src/cmds/audit/output/forestrySettingsSchema.json"
  //   ),
  //   JSON.stringify(ForestrySettingsSchema, null, 2)
  // );
  // await fs.writeFileSync(
  //   path.resolve(
  //     __dirname + "/../src/cmds/audit/output/forestryFMTSchema.json"
  //   ),
  //   JSON.stringify(ForestryFMTSchema, null, 2)
  // );

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
    printErrors(validate.errors, fmt);
  } else {
    console.log(`${fmtPath} is ${successText("valid")}`);
  }
};

const printErrors = (errors, object) => {
  errors.map((error) => {
    const handler = keywordError[error.keyword];
    handler(error, object);
  });
};

const keywordError = {
  required: (error) => {
    console.log(`${propertyName(error)} ${error.message}`);
  },
  const: (error) => {
    console.log(`Unanticipated error - ${error.keyword}`);
    console.log(error);
  },
  additionalProperties: (error, object) => {
    console.log(
      `${propertyName(
        error,
        object
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
      `${propertyName(error)} ${error.message} but got ${dangerText(
        error.data
      )}.
    Allowed values: ${successText(error.schema.join(", "))}
`
    );
  },
  type: (error, object) => {
    console.log(
      `${propertyName(error, object)} ${error.message.replace(
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
    let value = error.data;
    if (typeof error.data === "string" && error.data.length === 0) {
      value = `""`;
    }
    if (Array.isArray(error.data)) {
      return `an array`;
    }
    return `${typeof error.data} (${value})`;
  }
};

const propertyName = (error, object = null) => {
  if (object) {
    const lastFieldIndex = error.dataPath
      .split(".")
      .reverse()
      .findIndex((item) => /fields\[[0-9]+\]/.test(item));
    const steps = error.dataPath.split(".").length;

    const dataPath = error.dataPath
      .split(".")
      .reverse()
      .slice(lastFieldIndex, steps - 1)
      .reverse()
      .join(".");

    const property = error.dataPath.replace("." + dataPath, "");

    const field = get(object, dataPath);
    // console.log(field);
    return `
Field with name ${successText(field.name)} of type ${neutralText(
      field.type
    )} has an invalid property ${dangerText(property)}
     at ${dataPath}
    `;
  }
  return neutralText(error.dataPath);
};
