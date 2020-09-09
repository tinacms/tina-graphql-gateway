type Document = {
  [key: string]: any;
  content?: string;
  data: {
    [key: string]: object | string[] | string | object[];
  };
};

// FIXME: use unknown here
export const isDocumentArgs = (args: any): args is DocumentArgs => {
  return args.path;
};
export type Field =
  | {
      name: string;
      type: "textarea";
      default?: string;
      label: string;
      config?: {
        required: boolean;
        wysiwyg: boolean;
        schema: {
          format: "markdown";
        };
      };
    }
  | {
      name: string;
      type: "blocks";
      default?: string;
      label: string;
      template_types: string[];
    }
  | {
      name: string;
      type: "select";
      default?: string;
      label: string;
    };
export type DocumentArgs = {
  path: string;
};

export type DataSource = {
  getData: ({ path }: DocumentArgs) => DocumentSummary;
};

export type Template = {
  label: string;
  hide_body: boolean;
  fields: Field[];
};

type Section =
  | {
      type: "heading";
      label: string;
    }
  | {
      type: "document";
      path: string;
      label: string;
      readonly: boolean;
    }
  | {
      type: "directory";
      path: string;
      label: string;
      create: "documents";
      match: string;
      new_doc_ext: "md" | "html";
      templates: Template[];
    };

type TinaSchema = {
  settings: {
    sections: Section[];
  };
  documents: Document[];
};

export type DocumentSummary = {
  _template: string;
  _fields: { [key: string]: Field | { [key: string]: Field } };
} & Document;

export const FilesystemDataSource = (): DataSource => {
  return {
    getData: (args) => {
      return {
        _template: "some-real-data",
        _fields: {},
        data: { some: "" },
        content: "",
      };
    },
  };
};
