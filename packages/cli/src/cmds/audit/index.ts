import Ajv from "ajv";
import YAML from "yaml";
import fs from "fs-extra";
import path from "path";
import { neutralText, successText, dangerText } from "../../utils/theme";
import { ForestryFMTSchema } from "./schema/fmt";
import { ForestrySettingsSchema } from "./schema/settings";
import get from "lodash.get";

export async function audit(
  _ctx,
  _next,
  {
    migrate = false,
    forestry = false,
    fix = false,
  }: {
    migrate: boolean;
    forestry: boolean;
    fix: boolean;
  }
) {
  let anyErrors = [];

  const workingDirReal = process.cwd();

  const configFolder = migrate || forestry ? ".forestry" : ".tina";

  const shouldFix = migrate || fix;

  if (shouldFix) {
    var ajv = new Ajv({
      allErrors: true,
      verbose: true,
      removeAdditional: true,
      coerceTypes: "array",
    }).addKeyword("removeIfFails", {
      // Used for remove empty datetime since that is invalid
      // https://github.com/ajv-validator/ajv/issues/300#issuecomment-247667922
      inline(it) {
        return `if (errors) {
            vErrors.length = errs_${it.dataLevel || ""};
            errors = errs_${it.dataLevel || ""};
            delete data${it.dataLevel - 1 || ""}[${
          it.dataPathArr[it.dataLevel]
        }];
          }`;
      },
      statements: true,
    });
  } else {
    var ajv = new Ajv({
      allErrors: true,
      verbose: true,
    });
  }

  const fmtDirPath = path.resolve(
    workingDirReal + `/${configFolder}/front_matter/templates`
  );

  if (!(await fs.existsSync(fmtDirPath))) {
    if (!migrate || !forestry) {
      throw `No directory found. Have you migrated yet (forestry schema:audit --migrate)?
      Path: ${fmtDirPath}`;
    }
  }

  validateFile(
    workingDirReal,
    `${configFolder}/settings.yml`,
    ForestrySettingsSchema,
    ajv,
    migrate,
    anyErrors
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
      await validateFile(
        fmtDirPath,
        fmtPath,
        ForestryFMTSchema,
        ajv,
        migrate,
        anyErrors
      );
    })
  );

  if (anyErrors.length > 0) {
    throw `Audit failed with ${anyErrors.length} error(s)`;
  } else {
    console.log(`Audit completed with no errors.`);
  }
}

const validateFile = async (
  fmtDirPath,
  fmtPath,
  schema,
  ajv,
  migrate,
  anyErrors
) => {
  const fmtFullPath = fmtDirPath + "/" + fmtPath;
  const fmtString = await fs.readFileSync(fmtFullPath).toString();
  if (typeof fmtString !== "string") {
    throw "Expected a string";
  }
  const fmt = YAML.parse(fmtString);
  var validate = ajv.compile(schema);
  var valid = validate(fmt);

  if (!valid) {
    anyErrors.push(fmtPath);
    console.log(`${neutralText(fmtPath)} is ${dangerText("invalid")}`);
    printErrors(validate.errors, fmt);
    console.log("\n");
  } else {
    console.log(`${neutralText(fmtPath)} is ${successText("valid")}`);
  }
  if (migrate) {
    await fs.outputFile(
      fmtFullPath.replace(".forestry", ".tina"),
      YAML.stringify(fmt)
    );
  }
};

const printErrors = (errors, object) => {
  errors.map((error) => {
    const handler = keywordError[error.keyword];
    if (!handler) {
      console.error(`Unable to find handler for ${error.keyword}`);
    } else {
      handler(error, object);
    }
  });
};

const keywordError = {
  required: (error) => {
    console.log(`${propertyName(error)} ${error.message}`);
  },
  minItems: (error) => {
    console.log(`${propertyName(error)} ${error.message}`);
  },
  const: (error) => {
    if (error.schema === "now") {
      // We accept either `now` or a datetime formatted string, the `oneOf` handler
      // has better info on this so we'll ignore it here and handle it there
    } else {
      console.log(`Unanticipated error - ${error.keyword}`);
      console.log(error);
    }
  },
  format: (error, object) => {
    if (error.schema === "date-time") {
      // We accept either `now` or a datetime formatted string, the `oneOf` handler
      // has better info on this so we'll ignore it here and handle it there
    } else {
      console.log(`Unanticipated error - ${error.keyword}`);
    }
  },
  anyOf: (error, object) => {
    console.log(`${propertyName(error, object)} should be one of:
    ${oneOfSchemaMessage(error)}
    But got ${dangerText(displayType(error))}
`);
  },
  oneOf: (error) => {
    console.log(`Unanticipated error - ${error.keyword}`);
    console.log(error);
  },
  datetimeFormat: (error, object) => {
    console.log(
      `${propertyName(
        error,
        object
      )} should be either "now" or a valid datetime format (${dangerText(
        error.data
      )})`
    );
  },
  minLength: (error, object) => {
    console.log(
      `${propertyName(error, object)} should not be shorter than ${dangerText(
        error.params.limit
      )} character`
    );
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
  enum: (error, object) => {
    console.log(
      `${propertyName(error)} ${error.message} but got ${dangerText(
        displayType(error)
      )}
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

const oneOfSchemaMessage = (error) => {
  return error.schema
    .map((item) => {
      if (item.const) {
        return ` - A value equal to ${successText(item.const)}`;
      }

      if (item.format) {
        return `     - A value which adheres to the ${
          jsonSchemaFormats[item.format]
        } format`;
      }

      console.log(`Unrecognized oneOf schema key`, item);
    })
    .join("\n");
};

const jsonSchemaFormats = {
  "date-time": "datetime",
};
