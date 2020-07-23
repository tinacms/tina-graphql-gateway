import {
  DirectorySection,
  DocumentList,
  FieldType,
  ListField,
  Section,
  SectionList,
  SectionSelect,
  SelectField,
  Settings,
} from "./datasources/datasource";
import {
  FieldSourceType,
  ListValue,
  TemplatePage,
  Templates,
  TemplatesData,
} from "./fields/types";
import { GraphQLError, GraphQLObjectType } from "graphql";
import matterOrig, { GrayMatterOption, Input } from "gray-matter";

import camelCase from "lodash.camelcase";
import flatten from "lodash.flatten";
import kebabCase from "lodash.kebabcase";
import toLower from "lodash.tolower";
import upperFist from "lodash.upperfirst";

// TODO: find the right spot for this
export const FMT_BASE = ".forestry/front_matter/templates";
export const matter = <I extends Input, O extends GrayMatterOption<I, O>>(
  data: Buffer
) => {
  let res;
  res = matterOrig(data, { excerpt_separator: "<!-- excerpt -->" });

  return res;
};

export const shortFMTName = (path: string) => {
  return path.replace(`${FMT_BASE}/`, "").replace(".yml", "");
};

export const friendlyName = (name: string, options = { suffix: "" }) => {
  const delimiter = "_";

  return upperFist(
    camelCase(
      shortFMTName(name) + (options.suffix && delimiter + options.suffix)
    )
  );
};

export const slugify = (string: string) => {
  return toLower(kebabCase(string));
};

export const getFmtForDocument = (
  itemPath: string,
  templatePages: {
    name: string;
    pages: string[];
  }[]
): TemplatePage => {
  const fmt = templatePages.find(({ pages }) => {
    return pages?.includes(itemPath);
  });

  if (!fmt) {
    throw new GraphQLError(`Unable to find FMT for path: ${itemPath}`);
  }

  return fmt;
};

export const getPagesForSection = (
  section: string,
  sectionFmts: {
    name: string;
    templates: string[];
  }[],
  templatePages: {
    name: string;
    pages: string[];
  }[]
): string[] => {
  const sectionFmt = sectionFmts.find(
    (sectionFmt) => sectionFmt.name === section
  );

  if (!sectionFmt) {
    throw new GraphQLError(`Unable to find FMT for ${section}`);
  }

  const pages = flatten(
    sectionFmt.templates.map((templateName) => {
      const meh =
        templatePages.find(({ name }) => name === templateName)?.pages || [];
      return meh;
    })
  );

  return pages;
};

export function isString(arg: unknown | unknown[]): arg is string {
  return typeof arg === "string";
}

export function isSelectField(field: FieldType): field is SelectField {
  return field.type === "select";
}

export function isSectionSelectField(field: FieldType): field is SectionSelect {
  if (!isSelectField(field)) {
    return false;
  }
  return field?.config?.source?.type === "pages";
}

export function isDirectorySection(
  section: Section
): section is DirectorySection {
  return section.type === "directory";
}

export function isListField(field: FieldType): field is ListField {
  return field.type === "list";
}
export function isDocumentListField(field: FieldType): field is DocumentList {
  if (!isListField(field)) {
    return false;
  }

  if (field && field.config && field?.config?.source?.type === "documents") {
    return true;
  } else {
    return false;
  }
}

export function isListValue(val: FieldSourceType): val is ListValue {
  // FIXME: not sure if this is strong enough
  return val.hasOwnProperty("template");
}

export function isSectionListField(field: FieldType): field is SectionList {
  if (!isListField(field)) {
    return false;
  }
  return field?.config?.source?.type === "pages";
}
export function isNotNull<T>(arg: T): arg is Exclude<T, null> {
  return arg !== null;
}

export const getSectionFmtTypes = (
  settings: Settings,
  templateObjectTypes: Templates
) => {
  const sectionTemplates = flatten(
    settings.data.sections
      .filter(isDirectorySection)
      .map(({ templates }) => templates)
  );

  return sectionTemplates
    .map((sectionTemplate) => templateObjectTypes[sectionTemplate])
    .filter(isNotNull);
};

export const getSectionFmtTypes2 = (
  section: string,
  sectionFmts: {
    name: string;
    templates: string[];
  }[],
  templateObjectTypes: Templates
) => {
  const activeSectionTemplates = sectionFmts.find(
    ({ name }) => name === section
  );
  const types = activeSectionTemplates?.templates
    .map((templateName: string) => templateObjectTypes[templateName])
    ?.filter(isNotNull);

  if (!types || types.length === 0) {
    throw new GraphQLError(`No types found for section ${section}`);
  }

  return types;
};

/*
 * Takes in a list of strings corresponding to the types the blocks field contain,
 * and returns a list of corresponding GraphQL object types.
 */
export const getBlockFmtTypes = (
  templateTypes: string[],
  templateDataObjectTypes: TemplatesData
): GraphQLObjectType[] => {
  return templateTypes.map((template) => templateDataObjectTypes[template]);
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
