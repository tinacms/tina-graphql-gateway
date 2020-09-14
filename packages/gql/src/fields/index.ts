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
