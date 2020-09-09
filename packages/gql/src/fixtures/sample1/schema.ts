export const schema: TinaSchema = {
  settings: {
    sections: [
      {
        type: "heading",
        label: "Meh",
      },
      {
        type: "directory",
        create: "documents",
        label: "Post",
        match: "**/*.md",
        new_doc_ext: "md",
        path: "posts",
        templates: [
          {
            label: "Some Template",
            hide_body: false,
            fields: [
              {
                type: "textarea",
                label: "Text Area",
                name: "some-text",
                default: "Some random text",
                config: {
                  required: true,
                  wysiwyg: true,
                  schema: {
                    format: "markdown",
                  },
                },
              },
            ],
          },
        ],
      },
    ],
  },
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

type Document = {
  content?: string;
  data: {
    [key: string]: object | string[] | string | object[];
  };
};

type TinaSchema = {
  settings: {
    sections: Section[];
  };
  documents: Document[];
};
