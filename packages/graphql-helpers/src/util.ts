import camelCase from "lodash.camelcase";
import upperFirst from "lodash.upperfirst";
import kebabcase from "lodash.kebabcase";

export const FMT_BASE = ".forestry/front_matter/templates";
export const shortFMTName = (path: string) => {
  return path.replace(`${FMT_BASE}/`, "").replace(".yml", "");
};

export const friendlyName = (name: string, options = { suffix: "" }) => {
  const delimiter = "_";

  return upperFirst(
    camelCase(
      shortFMTName(name) + (options.suffix && delimiter + options.suffix)
    )
  );
};

export const arrayToObject = <T>(
  array: T[],
  func: (accumulator: { [key: string]: any }, item: T) => void
) => {
  const accumulator = {};
  array.forEach((item) => {
    func(accumulator, item);
  });

  return accumulator;
};

type FriendlyType = { __namespace?: string; name: string } | string | string[];
export const friendlyName2 = (
  field: FriendlyType = "",
  suffix = "",
  lowerCase = false
) => {
  let transform = (word: string) => upperFirst(camelCase(word));
  if (lowerCase) {
    transform = (word: string) => camelCase(word);
  }

  if (Array.isArray(field)) {
    const meh = `${field.map((f) => transform(f)).join("_")}${
      suffix && "_" + suffix
    }`;
    return meh;
  } else {
    if (typeof field === "string") {
      if (field) {
        return `${transform(field)}${suffix ? "_" + suffix : ""}`;
      } else {
        return suffix;
      }
    } else {
      const meh = `${
        field.__namespace ? transform(field.__namespace) + "_" : ""
      }${transform(field.name)}${suffix && "_" + suffix}`;
      return meh;
    }
  }
};

export const templateName = (string: string) => {
  return kebabcase(string);
};

export const templateTypeName = (
  template: FriendlyType,
  suffix: string,
  includeBody: boolean
) => {
  const suffixName = (includeBody ? "Doc_" : "") + suffix;
  return friendlyName2(template, suffixName);
};

export const slugify = (string: string) => {
  return kebabcase(string);
};
