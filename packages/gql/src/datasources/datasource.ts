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
  getData: ({ path }: DocumentArgs) => Promise<TinaDocument>;
  getTemplateForDocument: ({ path }: DocumentArgs) => Promise<TemplateData>;
  getTemplate: ({ slug }: { slug: string }) => Promise<TemplateData>;
  getTemplatesForSection: (
    section: string | undefined
  ) => Promise<TemplateData[]>;
};

export type DocumentSummary = {
  _template: string;
} & TinaDocument;

export type DocumentPartial = {
  _fields: { [key: string]: Field | { [key: string]: Field } };
} & TinaDocument;
