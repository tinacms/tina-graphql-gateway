import type { Field } from "../fields";
import type {
  TemplateData,
  Settings,
  Section,
  DirectorySection,
} from "../types";

export type TinaDocument = {
  [key: string]: any;
  content?: string;
  data: {
    [key: string]: object | string[] | string | object[];
  };
};

export type UpdateArgs = {
  relativePath: string;
  section: string;
  params: { content?: string; data: object };
};
export type DocumentArgs = {
  relativePath: string;
  section: string;
};

export interface DataSource {
  /**
   * `getData`
   *
   * Returns the parsed content from a specified path
   *
   * ```js
   * // Example
   * {
   *   data: {
   *     title: "Hello, World"
   *   }
   * }
   * ```
   */
  getData: (args: DocumentArgs) => Promise<TinaDocument>;
  getDocumentMeta: (
    args: DocumentArgs
  ) => Promise<{
    basename: string;
    extension: string;
    filename: string;
  }>;
  getTemplateForDocument: (args: DocumentArgs) => Promise<TemplateData>;
  getTemplates: (slugs: string[]) => Promise<TemplateData[]>;
  getTemplate: (slug: string) => Promise<TemplateData>;
  /**
   * `getTemplatesForSection`
   *
   * Returns the parsed templates for a given section. If no section is provided
   * it returns a flattened array of all possible section templates
   *
   * ```js
   * // Example
   * [
   *   {
   *     label: 'Post',
   *     hide_body: false,
   *     display_field: 'title',
   *     fields: [ {
   *       name: "title",
   *       label: "Title",
   *       type: "textarea",
   *       ...
   *     }]
   *     pages: [ 'posts/1.md' ]
   *   },
   *   ...
   * ]
   * ```
   */
  getTemplatesForSection: (section?: string) => Promise<TemplateData[]>;
  getDocumentsForSection: (section?: string) => Promise<string[]>;
  getSettingsForSection: (section?: string) => Promise<DirectorySection>;
  getSectionsSettings: () => Promise<DirectorySection[]>;
  updateDocument: (param: UpdateArgs) => Promise<void>;
}

export type DocumentSummary = {
  _template: string;
} & TinaDocument;

export type DocumentPartial = {
  _fields: { [key: string]: Field | { [key: string]: Field } };
} & TinaDocument;
