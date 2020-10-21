import type { Field, TinaField } from "./fields";

export type DirectorySection = {
  type: "directory";
  label: string;
  slug: string;
  path: string;
  create: "documents" | "all";
  match: string;
  new_doc_ext: string;
  templates: string[];
};

export type HeadingSection = {
  type: "heading";
  label: string;
  slug: string;
};

export type DocumentSection = {
  type: "document";
  label: string;
  path: string;
  slug: string;
};

interface SectionMap {
  directory: DirectorySection;
  heading: HeadingSection;
  document: DocumentSection;
}

type Section = SectionMap[keyof SectionMap];

export const byTypeWorks = <T extends keyof SectionMap>(type: T) => (
  section: Section
): section is SectionMap[T] => section.type === type;

export type Settings = {
  data: { sections: Section[] };
};

export type WithFields = {
  label: string;
  fields: Field[];
  __namespace: string;
};
/**
 * The data portion of the template file. Currently a template
 * is parsed with gray-matter, which returns a "content" and "data"
 * key. TemplateData is the "data" portion
 * ```yaml
 * label: Some Label
 * hide_body: true
 * fields:
 *   - name: title
 *     label: Title
 *     type: text
 * pages:
 *   - path/to/page.md
 * ```
 */
export type TemplateData = WithFields & {
  name: string;
  hide_body?: boolean;
  display_field?: string;
  pages?: string[];
};

export type TemplateDataWithNoName = WithFields & {
  hide_body?: boolean;
  display_field?: string;
  pages?: string[];
};

export type TinaTemplateData = {
  label: string;
  fields: TinaField[];
};

export type Template = {
  data: TemplateData;
};

/**
 * The 'name' field doesn't exist
 * on the template definition, we use
 * the file's basename as it's value
 * after fetching
 */
export type RawTemplate = {
  data: TemplateDataWithNoName;
};
