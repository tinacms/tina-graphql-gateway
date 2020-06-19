import { TextareaField } from "./fields/textarea";
import { TextField } from "./fields/text";
import { NumberField } from "./fields/number";
import { DateField } from "./fields/datetime";
import { BooleanField } from "./fields/boolean";
import { FileField } from "./fields/file";
import { TagListField } from "./fields/tagList";
import { GalleryField } from "./fields/imageGallery";
import { SelectField } from "./fields/select";
import { ListField } from "./fields/list";
import { FieldGroupField } from "./fields/group";
import { FieldGroupListField } from "./fields/group";
import { BlocksField } from "./fields/blocks";
import { GraphQLObjectType, GraphQLFieldConfig } from "graphql";

export type DirectorySection = {
  type: "directory";
  label: string;
  path: string;
  create: "documents" | "all";
  match: string;
  new_doc_ext: string;
  templates: string[];
};
type HeadingSection = {
  type: "heading";
  label: string;
};
type DocumentSection = {
  type: "document";
  label: string;
  path: string;
};
export type Section = DirectorySection | HeadingSection | DocumentSection;

export type WithFields = {
  label: string;
  name: string;
  type: string;
  fields: FieldType[];
};

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

export type TemplatePage = { name: string; pages: string[] };

export type Templates = {
  [key: string]: null | GraphQLObjectType;
};
export type PluginFieldArgs = {
  fmt: string;
  field: FieldType;
  templatePages: TemplatePage[];
  templates: Templates;
  rootPath: string;
  sectionFmts: {
    name: string;
    templates: string[];
  }[];
};

export type FieldSourceType = {
  [key: string]: string | string[];
};
export type FieldContextType = {};
export type Plugin = {
  matches: (string: FieldType["type"], field: FieldType) => boolean;
  run: (
    string: FieldType["type"],
    stuff: PluginFieldArgs
  ) => GraphQLFieldConfig<FieldSourceType, FieldContextType>;
};
