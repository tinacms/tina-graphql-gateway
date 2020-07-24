import * as utils from "./util";

describe("shortFMTName", () => {
  test("it should remove the extension", () => {
    const input = "action-newsletter.yml";
    const output = "action-newsletter";
    expect(utils.shortFMTName(input)).toEqual(output);
  });
  test("it should remove the FMT base path", () => {
    const input = `${utils.FMT_BASE}/action-newsletter.yml`;
    const output = "action-newsletter";
    expect(utils.shortFMTName(input)).toEqual(output);
  });
});

describe("friendlyName", () => {
  test("it should convert to CamelCase", () => {
    const input = "action-newsletter.yml";
    const output = "ActionNewsletter";
    expect(utils.friendlyName(input)).toEqual(output);
  });
  test("it should add suffix", () => {
    const input = "action-newsletter.yml";
    const output = "ActionNewsletterSuffix";
    expect(utils.friendlyName(input, { suffix: "suffix" })).toEqual(output);
  });
});
