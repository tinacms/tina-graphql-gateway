import type { Field } from "../fields";
import type { TemplateData } from "../types";

export type TinaDocument = {
  [key: string]: any;
  content?: string;
  data: {
    [key: string]: object | string[] | string | object[];
  };
};

export type DocumentArgs = {
  path: string;
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
  getData: ({ path }: DocumentArgs) => Promise<TinaDocument>;
  getTemplateForDocument: ({ path }: DocumentArgs) => Promise<TemplateData>;
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
  updateDocument: (param: {
    path: string;
    params: { content?: string; data: object };
  }) => Promise<void>;
}

export type DocumentSummary = {
  _template: string;
} & TinaDocument;

export type DocumentPartial = {
  _fields: { [key: string]: Field | { [key: string]: Field } };
} & TinaDocument;
