import type { Field, TinaField } from "./fields";

export type DirectorySection = {
  type: "directory";
  label: string;
  path: string;
  create: "documents" | "all";
  match: string;
  new_doc_ext: string;
  templates: string[];
};
export type HeadingSection = {
  type: "heading";
  label: string;
};
export type DocumentSection = {
  type: "document";
  label: string;
  path: string;
};
// export type Section = DirectorySection | HeadingSection | DocumentSection;

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
};
export type TemplateData = WithFields & {
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
