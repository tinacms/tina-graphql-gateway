import { validator } from "../../validator";
import { validateFile } from "../../index";

// To see console.log disable this
jest.spyOn(console, "log").mockImplementation();
const ajv = validator(true);
const ajvWithErrors = validator(false);
export const setupTests = (example, schema) => {
  Object.keys(example).map((item) => {
    describe(item, () => {
      const { initial, fixed, errors } = example[item];

      if (fixed) {
        test(`is fixed properly`, async () => {
          const output = await validateFile({
            fmtPath: "my-path.yml",
            payload: initial,
            schema,
            ajv,
            anyErrors: [],
            migrate: true,
          });
          expect(output.fmt).toEqual(fixed);
        });
      } else {
        test(`is unabled to be fixed`, async () => {
          const output = await validateFile({
            fmtPath: "my-path.yml",
            payload: initial,
            schema,
            ajv,
            anyErrors: [],
            migrate: true,
          });
          expect(output.success).toEqual(false);
        });
      }
      if (errors) {
        test(`has proper errors`, async () => {
          const outputWithErrors = await validateFile({
            fmtPath: "my-path.yml",
            payload: initial,
            schema,
            ajv: ajvWithErrors,
            anyErrors: [],
            migrate: false,
          });

          const errorMessages = outputWithErrors.errors.map(
            (error) => error.message
          );
          errorMessages.map((message) => {
            expect(errors).toContain(message);
          });

          errors.map((errorMessage) => {
            if (!errorMessages.includes(errorMessage)) {
              throw `Expected to find error message '${errorMessage}'`;
            }
          });
        });
      }
    });
  });
};
