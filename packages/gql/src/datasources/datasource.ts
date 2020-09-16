import type { Field } from "../fields";
import type { Template, TemplateData } from "../types";

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
// FIXME: use unknown here
export const isDocumentArgs = (args: any): args is DocumentArgs => {
  return args.path;
};
export type DataSource = {
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
  getTemplate: ({ slug }: { slug: string }) => Promise<TemplateData>;
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
};

export type DocumentSummary = {
  _template: string;
} & TinaDocument;

export type DocumentPartial = {
  _fields: { [key: string]: Field | { [key: string]: Field } };
} & TinaDocument;
