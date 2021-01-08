import * as utils from "./util";

describe("friendlyName", () => {
  test("it should convert to CamelCase", () => {
    const input = "action-newsletter.yml";
    const output = "ActionNewsletterYml";
    expect(utils.friendlyName(input)).toEqual(output);
  });
  test("it should add suffix", () => {
    const input = "action-newsletter.yml";
    const output = "ActionNewsletterYml_suffix";
    expect(utils.friendlyName(input, { suffix: "suffix" })).toEqual(output);
  });
});
