import * as utils from "./util";

describe("slugify", () => {
  test("should be able to slugify", () => {
    const input = "Slugify Test";
    const output = "slugify-test";
    expect(utils.slugify(input)).toEqual(output);
  });
});
