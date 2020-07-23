import Ajv from "ajv";

export const validator = (shouldFix) => {
  if (shouldFix) {
    var ajv = new Ajv({
      allErrors: true,
      verbose: true,
      removeAdditional: true,
      coerceTypes: "array",
      // strictNumbers: true,
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

  return ajv;
};
