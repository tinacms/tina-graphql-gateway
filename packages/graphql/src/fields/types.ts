import { DataSource, FieldType } from "../datasources/datasource";
import {
  GraphQLFieldConfig,
  GraphQLInputType,
  GraphQLObjectType,
  GraphQLType,
} from "graphql";

export type BaseDocumentType = {
  content: string;
  isEmpty: boolean;
  excerpt: string;
};

export type DocumentData = { [key: string]: unknown };
export type DocumentType = BaseDocumentType & {
  path: string;
  template: string;
  data: DocumentData;
};

export type TemplatePage = { name: string; pages: string[] };

export type Templates = {
  [key: string]: null | GraphQLObjectType;
};
export type TemplatesData = { [key: string]: GraphQLObjectType };

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

// TODO: want to use something more helpful here
export type ListValue = { [key: string]: FieldType[] };
export type FieldSourceType = FieldType | ListValue;
export type FieldContextType = {
  dataSource: DataSource;
};
export type Plugin = {
  matches: (string: FieldType["type"], field: FieldType) => boolean;
  run: (
    string: FieldType["type"],
    stuff: PluginFieldArgs
  ) => GraphQLFieldConfig<FieldSourceType, FieldContextType>;
};

export type configType = {
  rootPath: string;
  siteLookup: string;
};
