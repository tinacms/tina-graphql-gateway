import { validator } from "../../validator";
import { validateFile } from "../../index";
import { ForestryFMTSchema } from "../fmt";

/**
 * The idea with these test are that you can provide 3 keys (initial, error, fixed).
 *
 * Initial is the setup
 *
 * Error is the expectation for what kind of error we'll get
 *
 * Fixed is the result if the error can be fixed automatically, if it can't be fixed
 * this value should be left off.
 */

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeUnsuccessful(): R;
      toBeSuccessful(): R;
    }
  }
}

expect.extend({
  toBeSuccessful(received) {
    const pass = received.success;
    if (pass) {
      return {
        message: () => `response was successful`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected to be able to fix data but there were still errors`,
        pass: false,
      };
    }
  },
  toBeUnsuccessful(received) {
    const pass = !received.success;
    if (pass) {
      return {
        message: () => `response was unsuccessful`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected response to be unsuccessful`,
        pass: false,
      };
    }
  },
});

// To see console.log disable this
jest.spyOn(console, "log").mockImplementation();
export const setupTests = (example) => {
  Object.keys(example).map((item) => {
    const ajv = validator(true);
    const ajvWithErrors = validator(false);
    describe(item, () => {
      const { initial, fixed, errors } = example[item];

      const payload = {
        label: "my-fmt",
        hide_body: false,
        fields: [initial],
      };

      if (fixed) {
        test(`is fixed properly`, async () => {
          const output = await validateFile({
            fmtPath: "my-path.yml",
            payload,
            schema: ForestryFMTSchema,
            ajv,
            anyErrors: [],
            migrate: true,
          });
          expect(output).toBeSuccessful();
          expect(output.fmt.fields[0]).toEqual(fixed);
        });
      } else {
        test(`is unabled to be fixed`, async () => {
          const output = await validateFile({
            fmtPath: "my-path.yml",
            payload,
            schema: ForestryFMTSchema,
            ajv,
            anyErrors: [],
            migrate: true,
          });
          expect(output).toBeUnsuccessful();
        });
      }
      if (errors) {
        test(`has proper errors`, async () => {
          const outputWithErrors = await validateFile({
            fmtPath: "my-path.yml",
            payload,
            schema: ForestryFMTSchema,
            ajv: ajvWithErrors,
            anyErrors: [],
            migrate: false,
          });

          const errorKeys = outputWithErrors.errors;
          const errorList = errorKeys.map(({ dataPath, keyword }) => {
            return { dataPath: dataPath.replace(".fields[0]", ""), keyword };
          });

          expect(errorList).toEqual(
            errors.map(({ dataPath, keyword }) => {
              return { dataPath: `${dataPath}`, keyword };
            })
          );
        });
      }
    });
  });
};
