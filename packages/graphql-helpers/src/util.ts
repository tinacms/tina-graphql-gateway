/**
Copyright 2021 Forestry.io Inc
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

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

/**
 * This generates the typename for the given template, which isn't as straightforward
 * is it would ideally be, the reason for this is because templates are used for documents
 * and blocks within documents, and when used for a document they autmotically have a _body
 * field, so the types are different. We're appending "Template" to block-level ones.
 */
export const templateTypeName = (
  template: FriendlyType,
  suffix: string,
  includeBody: boolean
) => {
  let suffixName = "";
  if (suffix === "Data") {
    suffixName = includeBody ? "" : "Template";
  } else {
    suffixName = (includeBody ? "" : "Template_") + suffix;
  }
  return friendlyName(template, { suffix: suffixName });
};

export const slugify = (string: string) => {
  // FIXME: Just remove this. We're forcing values to be in the valid format by default,
  // coercing them like this leads to other inconsistencies
  return string;
};
