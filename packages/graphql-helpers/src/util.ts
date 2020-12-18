import camelCase from "lodash.camelcase";
import upperFirst from "lodash.upperfirst";
import kebabcase from "lodash.kebabcase";

type FriendlyType = { __namespace?: string; name: string } | string | string[];

export const friendlyName = (
  field: FriendlyType,
  options?: {
    lowerCase?: boolean;
    suffix?: string;
  }
) => {
  const lowerCase = (options && options.lowerCase) || false;
  const suffix = (options && options.suffix) || "";

  let transform = (word: string) => upperFirst(camelCase(word));
  if (lowerCase) {
    transform = (word: string) => camelCase(word);
  }
  // if (field === "authors") {
  //   console.log("yes", field, options);
  // }

  if (Array.isArray(field)) {
    return `${field.map((f) => transform(f)).join("_")}${
      suffix && "_" + suffix
    }`;
  } else {
    if (typeof field === "string") {
      if (field) {
        return `${transform(field)}${suffix ? "_" + suffix : ""}`;
      } else {
        return suffix;
      }
    } else {
      return `${
        field.__namespace ? transform(field.__namespace) + "_" : ""
      }${transform(field.name)}${suffix && "_" + suffix}`;
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
  return friendlyName(template, { suffix: suffixName });
};

export const slugify = (string: string) => {
  return kebabcase(string);
};
