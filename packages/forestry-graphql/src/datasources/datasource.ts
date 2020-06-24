export interface DataSource {
  getData<T>(filepath: string): Promise<T>;
  getSettings(): Promise<Settings>;
  getTemplate(name: string): Promise<FMT>;
  writeData<T>(path: string, content: any, data: any): Promise<T>;
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

export interface Field {
  type: string;
  fields: Field[];
}

export type WithFields = {
  label: string;
  name: string;
  type: string;
  fields: FieldType[];
};
export type FMT = {
  data: WithFields & {
    label: string;
    hide_body: boolean;
    display_field: string;
    pages: string[];
  };
};

export type TextField = {
  label: string;
  name: string;
  type: "text";
  default: string;
  config?: {
    required?: boolean;
  };
};
export type TextareaField = {
  label: string;
  name: string;
  type: "textarea";
  config: {
    required: boolean;
    wysiwyg: boolean;
    schema: { format: "markdown" };
  };
};
export type TagListField = {
  label: string;
  name: string;
  type: "tag_list";
  default: string[];
  config?: {
    required?: boolean;
  };
};
export type BooleanField = {
  label: string;
  name: string;
  type: "boolean";
  config?: {
    required?: boolean;
  };
};
export type NumberField = {
  label: string;
  name: string;
  type: "number";
  config?: {
    required?: boolean;
  };
};
export type DateField = {
  label: string;
  name: string;
  type: "datetime";
  hidden: boolean;
  default: "now";
  config: {
    date_format: string;
    export_format: string;
    required: boolean;
  };
};
export type BlocksField = {
  label: string;
  name: string;
  type: "blocks";
  template_types: string[];
  config?: {
    min: string;
    max: string;
  };
};
export type FieldGroupField = WithFields & {
  label: string;
  name: string;
  type: "field_group";
  config?: {
    required?: boolean;
  };
};
export type FieldGroupListField = WithFields & {
  label: string;
  name: string;
  type: "field_group_list";
  config?: {
    required?: boolean;
  };
};
export type FileField = {
  label: string;
  name: string;
  type: "file";
  config?: {
    required?: boolean;
    maxSize: null | number;
  };
};
export type GalleryField = {
  label: string;
  name: string;
  type: "image_gallery";
  config: {
    required?: boolean;
    maxSize: null | number;
  };
};
export type BaseListField = {
  label: string;
  name: string;
  type: "list";
};
export type SimpleList = BaseListField & {
  config: {
    required?: boolean;
    use_select: boolean;
    min: null | number;
    max: null | number;
  };
};
export type SectionList = BaseListField & {
  config?: {
    required?: boolean;
    use_select: boolean;
    min: null | number;
    max: null | number;
    source: {
      type: "pages";
      section: string;
    };
  };
};
export type ListField = SectionList | SimpleList;

export type BaseSelectField = {
  label: string;
  name: string;
  type: "select";
};
export type SectionSelect = BaseSelectField & {
  config: {
    required: boolean;
    source: {
      type: "pages";
      section: string;
      file: string;
      path: string;
    };
  };
};
export type SimpleSelect = BaseSelectField & {
  default: string;
  config: {
    options: string[];
    required: boolean;
    source: {
      type: "simple";
    };
  };
};
export type SelectField = SectionSelect | SimpleSelect;
export type FieldType =
  | TextField
  | TextareaField
  | BlocksField
  | DateField
  | NumberField
  | BooleanField
  | TagListField
  | SelectField
  | ListField
  | GalleryField
  | FileField
  | FieldGroupField
  | FieldGroupListField;
