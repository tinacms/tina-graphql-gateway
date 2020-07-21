import Ajv from "ajv";
import _ from "lodash";
import * as jsyaml from "js-yaml";
import fs from "fs-extra";
import path from "path";
import get from "lodash.get";
import { neutralText, successText, dangerText } from "../../utils/theme";
import { ForestryFMTSchema } from "./schema/fmt";
import { ForestrySettingsSchema } from "./schema/settings";

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
      strictNumbers: true,
      $data: true,
    }).addKeyword("removeIfFails", {
      // Used for remove empty string datetime since it would be invalid
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
      $data: true,
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
  await fs.writeFileSync(
    path.resolve(
      __dirname + "/../src/cmds/audit/output/forestrySettingsSchema.json"
    ),
    JSON.stringify(ForestrySettingsSchema, null, 2)
  );
  await fs.writeFileSync(
    path.resolve(
      __dirname + "/../src/cmds/audit/output/forestryFMTSchema.json"
    ),
    JSON.stringify(ForestryFMTSchema, null, 2)
  );

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
  let fmt = jsyaml.safeLoad(fmtString);
  if (migrate) {
    fmt = preprocess(fmt);
    fmt = pruneEmpty(fmt);
  }
  var validate = ajv.compile(schema);
  var valid = validate(fmt);

  if (!valid) {
    anyErrors.push(fmtPath);
    console.log(`${fmtPath} is ${dangerText("invalid")}`);
    printErrors(validate.errors, fmt);
    console.log("\n");
  } else {
    if (migrate) {
      await fs.outputFile(
        fmtFullPath.replace(".forestry", ".tina"),
        jsyaml.dump(fmt)
      );
    }
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
    console.log(
      `${propertyName(error)} ${error.message} but got ${dangerText(
        displayType(error)
      )}`
    );
  },
  exclusiveMinimum: (error, object) => {
    console.log(`${propertyName(error, object)} ${error.message}`);
  },
  minimum: (error, object) => {
    console.log(
      `${propertyName(error)} ${error.message} but got ${dangerText(
        displayType(error)
      )}`
    );
  },
  maximum: (error, object) => {
    console.log(
      `${propertyName(error)} ${error.message} but got ${dangerText(
        displayType(error)
      )}`
    );
  },
  const: (error) => {
    if (error.schema === "now") {
      // Ignoring for this case since it's handled better by anyOf
    } else {
      console.log(`Unanticipated error - ${error.keyword}`);
      console.log(error);
    }
  },
  format: (error) => {
    if (error.schema === "date-time") {
      // Ignoring for this case since it's handled better by anyOf
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
  multipleOf: (error, object) => {
    console.log(
      `${propertyName(error, object)} ${error.message} but got ${dangerText(
        displayType(error)
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
      fieldType(field)
    )} has an invalid property ${dangerText(property)}
     at ${dataPath}
    `;
  }
  return neutralText(error.dataPath);
};

const fieldType = (field) => {
  if (field.type === "select") {
    return `${field.type} (${field.config.source.type})`;
  }

  return field.type;
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

      if (item.multipleOf || item.type === "null") {
        // Ignore, we're handling this better elsewhere
        return false;
      }
      console.log(`Unrecognized oneOf schema key`, item);
    })
    .filter(Boolean)
    .join("\n");
};

const jsonSchemaFormats = {
  "date-time": "datetime",
};

const preprocess = (json) => {
  const string = JSON.stringify(json);

  return JSON.parse(string, (key, value) => {
    if (key === "fields") {
      const itemWithRequired = value.find((item) => item.required);
      if (itemWithRequired) {
        itemWithRequired.config = {
          required: itemWithRequired.required,
          ...itemWithRequired.config,
        };
        delete itemWithRequired.required;
      }
    }
    return value;
  });
};

function pruneEmpty(obj) {
  return (function prune(current) {
    _.forOwn(current, function (value, key) {
      if (
        _.isUndefined(value) ||
        _.isNull(value) ||
        _.isNaN(value) ||
        (_.isString(value) && _.isEmpty(value)) ||
        (_.isObject(value) && _.isEmpty(prune(value)))
      ) {
        delete current[key];
      }
    });
    // remove any leftover undefined values from the delete
    // operation on an array
    if (_.isArray(current)) _.pull(current, undefined);

    return current;
  })(_.cloneDeep(obj)); // Do not modify the original object, create a clone instead
}
