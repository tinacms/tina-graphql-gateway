// const pack = require("./package");
import { createJestConfig } from "./create.jest.config";

const pack = {
  name: "somename",
};

module.exports = createJestConfig(pack);
