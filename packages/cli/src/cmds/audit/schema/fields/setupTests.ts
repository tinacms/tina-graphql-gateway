import { validator } from "../../validator";
import { validateFile } from "../../index";
import { ForestryFMTSchema } from "../fmt";

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
        message: () => `expected response to be successful`,
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
