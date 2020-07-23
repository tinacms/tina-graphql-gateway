import _ from "lodash";
import * as jsyaml from "js-yaml";
import fs from "fs-extra";
import path from "path";
import get from "lodash.get";
import { validator } from "./validator";
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

  const ajv = validator(shouldFix);

  const fmtDirPath = path.resolve(
    workingDirReal + `/${configFolder}/front_matter/templates`
  );

  if (!(await fs.existsSync(fmtDirPath))) {
    if (!migrate || !forestry) {
      throw `No directory found. Have you migrated yet (forestry schema:audit --migrate)?
      Path: ${fmtDirPath}`;
    }
  }
  const fmtFullPath = workingDirReal + "/" + `${configFolder}/settings.yml`;
  const fmtString = await fs.readFileSync(fmtFullPath).toString();
  if (typeof fmtString !== "string") {
    throw "Expected a string";
  }
  let payload = jsyaml.safeLoad(fmtString);

  const output = await validateFile({
    fmtPath: `${configFolder}/settings.yml`,
    payload,
    schema: ForestrySettingsSchema,
    ajv,
    migrate,
    anyErrors,
  });

  if (output.success) {
    if (migrate) {
      await fs.outputFile(
        fmtFullPath.replace(".forestry", ".tina"),
        jsyaml.dump(output.fmt)
      );
    }
  }

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
      const fmtFullPath = fmtDirPath + "/" + fmtPath;
      const fmtString = await fs.readFileSync(fmtFullPath).toString();
      if (typeof fmtString !== "string") {
        throw "Expected a string";
      }
      let payload = jsyaml.safeLoad(fmtString);

      const output = await validateFile({
        fmtPath,
        payload,
        schema: ForestryFMTSchema,
        ajv,
        migrate,
        anyErrors,
      });
      if (output.success) {
        if (migrate) {
          await fs.outputFile(
            fmtFullPath.replace(".forestry", ".tina"),
            jsyaml.dump(output.fmt)
          );
        }
      }
    })
  );

  if (anyErrors.length > 0) {
    throw `Audit failed with ${anyErrors.length} error(s)`;
  } else {
    console.log(`Audit completed with no errors.`);
  }
}

export const validateFile = async ({
  fmtPath,
  payload,
  schema,
  ajv,
  migrate,
  anyErrors,
}) => {
  let fmt = payload;
  if (migrate) {
    fmt = preprocess(fmt);
    fmt = pruneEmpty(fmt);
  }
  var validate = ajv.compile(schema);
  var valid = validate(fmt);

  if (!valid) {
    anyErrors.push(fmtPath);
    console.log(`${fmtPath} is ${dangerText("invalid")}`);
    const errorKeys = printErrors(validate.errors, fmt);
    console.log("\n");
    return { success: false, fmt, errors: errorKeys };
  } else {
    return { success: true, fmt, errors: [] };
  }
};

const printErrors = (errors, object) => {
  return errors
    .map((error) => {
      const handler = keywordError[error.keyword];
      if (!handler) {
        throw `Unable to find handler for ${error.keyword}`;
      } else {
        return handler(error, object);
      }
    })
    .filter(Boolean);
};

const keywordError = {
  required: (error, object) => {
    console.log(`${propertyName(error, object)} ${error.message}`);

    return error;
  },
  minItems: (error) => {
    console.log(
      `${propertyName(error)} ${error.message} but got ${dangerText(
        displayType(error)
      )}`
    );

    return error;
  },
  exclusiveMinimum: (error, object) => {
    console.log(`${propertyName(error, object)} ${error.message}`);

    return error;
  },
  minimum: (error, object) => {
    console.log(
      `${propertyName(error)} ${error.message} but got ${dangerText(
        displayType(error)
      )}`
    );

    return error;
  },
  maximum: (error, object) => {
    console.log(
      `${propertyName(error)} ${error.message} but got ${dangerText(
        displayType(error)
      )}`
    );

    return error;
  },
  const: (error) => {
    if (error.schema === "now") {
      // Ignoring for this case since it's handled better by anyOf
    } else {
      console.log(`Unanticipated error - ${error.keyword}`);
      console.log(error);
    }

    return false;
  },
  format: (error) => {
    if (error.schema === "date-time") {
      // Ignoring for this case since it's handled better by anyOf
    } else {
      console.log(`Unanticipated error - ${error.keyword}`);
    }
    return false;
  },
  anyOf: (error, object) => {
    console.log(`${propertyName(error, object)} should be one of:
    ${oneOfSchemaMessage(error)}
    But got ${dangerText(displayType(error))}
`);
    return error;
  },
  oneOf: (error) => {
    console.log(`Unanticipated error - ${error.keyword}`);
    console.log(error);
    return false;
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
    return error;
  },
  minLength: (error, object) => {
    console.log(
      `${propertyName(error, object)} should not be shorter than ${dangerText(
        error.params.limit
      )} character`
    );
    return error;
  },
  removeIfFails: () => {
    // Do nothing
    return false;
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
    return error;
  },
  multipleOf: (error, object) => {
    console.log(
      `${propertyName(error, object)} ${error.message} but got ${dangerText(
        displayType(error)
      )}`
    );
    return error;
  },
  enum: (error, object) => {
    console.log(
      `${propertyName(error, object)} ${error.message} but got ${dangerText(
        displayType(error)
      )}
        Allowed values: ${successText(error.schema.join(", "))}
    `
    );
    return error;
  },
  type: (error, object) => {
    console.log(
      `${propertyName(error, object)} ${error.message.replace(
        "should be",
        "should be of type"
      )} but got ${dangerText(displayType(error))}`
    );
    return error;
  },
  if: () => {
    // an error stating should match "then" schema
    // indicates that the conditional schema isn't matched -
    // we should get a more specific error elsewhere so ignore these
    // unless debugging.
    return false;
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
    if (field) {
      return `
Field with name ${successText(field.name)} of type ${neutralText(
        fieldType(field)
      )} has an invalid property ${dangerText(property)}
     at ${dataPath}
    `;
    } else {
      return `${neutralText(error.dataPath)}`;
    }
  }
  return neutralText(error.dataPath);
};

const fieldType = (field) => {
  if (field.type === "select" || field.type === "list") {
    if (!field.config) {
      return `${field.type} (text)`;
    }
    return `${field.type} (${field.config?.source?.type})`;
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
