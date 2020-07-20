import { audit } from "./index";

test("audit forestry.io config", async () => {
  const forestryioPath = process.cwd() + "/src/cmds/audit/fixtures/forestry.io";
  await audit(null, null, { workingDir: forestryioPath });
});

// test("audit forestry.io config", async () => {
//   const forestryioPath = process.cwd() + "/src/cmds/audit/fixtures/forestry.io";
//   await audit(null, null, { workingDir: forestryioPath });
// });
