import fs from "fs";
import matterOrig, { Input, GrayMatterOption } from "gray-matter";
import { Section, FieldType, DirectorySection } from "./fieldTypes";
import { SelectField, SectionSelect } from "./fields/select";
import { SectionList } from "./fields/list";

export const stringify = (content: string, data: object) => {
  return matterOrig.stringify(content, data);
};

export const matter = <I extends Input, O extends GrayMatterOption<I, O>>(
  data: Buffer
) => {
  let res;
  res = matterOrig(data, { excerpt_separator: "<!-- excerpt -->" });

  return res;
};

export const getDirectoryList = async (path: any) => {
  const list = await fs.readdirSync(path);

  return list.map((item) => `${path}/${item}`);
};

export const getData = async <T>(filepath: string): Promise<T> => {
  const result = matter(await fs.readFileSync(filepath));

  // @ts-ignore
  return result;
};

export function isDirectorySection(
  section: Section
): section is DirectorySection {
  return section.type === "directory";
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

export function isListField(field: FieldType): field is SelectField {
  return field.type === "list";
}
export function isNotNull<T>(arg: T): arg is Exclude<T, null> {
  return arg !== null;
}

export function isSectionListField(field: FieldType): field is SectionList {
  if (!isListField(field)) {
    return false;
  }
  return field?.config?.source?.type === "pages";
}

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
