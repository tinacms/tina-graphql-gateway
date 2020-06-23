export interface DataSource {
  getData<T>(filepath: string): Promise<T>;
  getSettings(): Promise<Settings>;
  getTemplate<T>(name: string): Promise<T>;
  writeData<T>(path: string, content: any, data: any): Promise<T>;
  getDirectoryList(path: string): Promise<string[]>;
  getTemplateList(): Promise<string[]>;
}

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
export type Section = DirectorySection | HeadingSection | DocumentSection;

export type Settings = {
  data: { sections: Section[] };
};
