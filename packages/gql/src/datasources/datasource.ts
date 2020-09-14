import type { Field } from "../fields";

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
  getTemplateForDocument: ({ path }: DocumentArgs) => Promise<Template>;
  getTemplate: ({ slug }: { slug: string }) => Promise<Template>;
};

export type Template = {
  label: string;
  hide_body: boolean;
  fields: Field[];
};

export type DocumentSummary = {
  _template: string;
} & TinaDocument;

export type DocumentPartial = {
  _fields: { [key: string]: Field | { [key: string]: Field } };
} & TinaDocument;

export const DataManager = (dataService: any): DataSource => {
  return {
    getData: async ({ path }) => {
      return dataService.getData(path);
    },
    getTemplateForDocument: async () => {
      return {
        label: "Author",
        hide_body: false,
        fields: [
          {
            type: "textarea" as const,
            label: "Name",
            name: "name",
          },
        ],
      };
    },
    getTemplate: async (slug) => {
      return {
        label: "Author",
        hide_body: false,
        fields: [
          {
            type: "textarea" as const,
            label: "Name",
            name: "name",
          },
        ],
      };
    },
  };
};
