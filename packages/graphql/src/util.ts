import { DirectorySection, Section, Settings } from "./datasources/datasource";
import { GraphQLError, GraphQLInputObjectType, getNamedType } from "graphql";
import { TemplatePage, Templates } from "./fields/types";
import matterOrig, { GrayMatterOption, Input } from "gray-matter";

import flatten from "lodash.flatten";
import kebabCase from "lodash.kebabcase";
import toLower from "lodash.tolower";

// TODO: There is probably too much in this "util" file. Once schemaBuilder
// is a bit cleaner, similar utils can be grouped together elsewhere

export const FMT_BASE = ".forestry/front_matter/templates";
export const matter = <I extends Input, O extends GrayMatterOption<I, O>>(
  data: Buffer
) => {
  let res;
  res = matterOrig(data, { excerpt_separator: "<!-- excerpt -->" });

  return res;
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

export function isDirectorySection(
  section: Section
): section is DirectorySection {
  return section.type === "directory";
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

export const getSectionFmtInputTypes = (
  settings: Settings,
  templateInputObjectTypes: {
    [key: string]: GraphQLInputObjectType;
  }
) => {
  const sectionTemplates = flatten(
    settings.data.sections
      .filter(isDirectorySection)
      .map(({ templates }) => templates)
  );

  return arrayToObject<GraphQLInputObjectType>(
    sectionTemplates
      .map((sectionTemplate) => templateInputObjectTypes[sectionTemplate])
      ?.filter(isNotNull),
    (obj: any, item: any) => {
      obj[(getNamedType(item) || "").toString()] = { type: item };
    }
  );
};

export function isNullOrUndefined<T>(
  obj: T | null | undefined
): obj is null | undefined {
  return typeof obj === "undefined" || obj === null;
}
