import Ajv from "ajv";

export const validator = ({ fix }) => {
  if (fix) {
    return new Ajv({
      allErrors: true,
      verbose: true,
      removeAdditional: true,
      coerceTypes: "array",
      $data: true,
    }).addKeyword("removeIfFails", {
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
  }

  return new Ajv({
    allErrors: true,
    verbose: true,
    $data: true,
  });
};
