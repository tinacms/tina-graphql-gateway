import {
  graphql,
  getNamedType,
  TypeInfo,
  visitWithTypeInfo,
  getDescription,
  GraphQLString,
} from "graphql";
import {
  GraphQLSchema,
  GraphQLFieldResolver,
  GraphQLTypeResolver,
  Source,
  parse,
  printSchema,
  visit,
  Visitor,
  ASTKindToNode,
  DocumentNode,
  FieldDefinitionNode,
  ASTNode,
  SelectionNode,
  NamedTypeNode,
} from "graphql";
import _ from "lodash";
import type { TemplateData } from "./types";
import { isDocumentArgs } from "./datasources/datasource";
import type { Field } from "./fields";
import { text } from "./fields/text";
import { textarea } from "./fields/textarea";
import { select } from "./fields/select";
import { list } from "./fields/list";
import { blocks } from "./fields/blocks";
import { fieldGroup } from "./fields/field-group";
import { fieldGroupList } from "./fields/field-group-list";
import type {
  DataSource,
  // TinaDocument,
  DocumentPartial,
} from "./datasources/datasource";

type VisitorType = Visitor<ASTKindToNode, ASTNode>;
export type ContextT = {
  datasource: DataSource;
};

type FieldResolverArgs = undefined | { path: string };

export type InitialSource = {
  _resolver: "_initial_source";
};
export type TinaDocument = {
  _resolver: "_tina_document";
  content?: string;
  data: {
    [key: string]: object | string[] | string | object[];
  };
};
export type TinaFormField = {
  _resolver: "_tina_form_field";
  [key: string]: object | string[] | string | object[];
};
export type TinaForm = {
  _resolver: "_tina_form";
  [key: string]: object | string[] | string | object[];
};
export type TinaData = {
  _resolver: "_tina_data";
  [key: string]: object | string[] | string | object[];
};
export type TinaDataField = {
  _resolver: "_tina_data_field";
  [key: string]: object | string[] | string | object[];
};

type FieldResolverSource =
  | InitialSource
  // | TinaDocument
  | TinaFormField
  | TinaDataField;

export const documentTypeResolver: GraphQLTypeResolver<
  TinaDocument,
  ContextT
> = (value, context, info) => {
  // console.log(value);
  if (value === "authors/homer.md") {
    return "Author";
  }

  return value.__typename;
};
export const fieldResolver: GraphQLFieldResolver<
  FieldResolverSource,
  ContextT,
  FieldResolverArgs
> = async (source, args, context, info) => {
  const value = source[info.fieldName];
  const { datasource } = context;

  if (value === "select") {
    // console.log(source);
  }
  if (source._resolver) {
    // console.log(info.fieldName);
    // console.log(source);
  }

  if (!value) {
    // console.log(info.fieldName);
    // console.log(source);
    return;
  }

  switch (value._resolver) {
    case "select_form":
      return await select.resolvers.optionsFetcher(datasource, value.field);
    case "select_data":
      return await select.resolvers.dataFieldBuilder(
        datasource,
        value.field,
        value.value
      );
    case "_initial_source":
      if (!args) {
        throw new Error(
          `Expected {path: string} as an argument but got undefined`
        );
      }
      const document = await datasource.getData(args);
      const template = await datasource.getTemplateForDocument(args);

      const resolvedTemplate = await resolveTemplate(datasource, template);
      const resolvedData = await resolveData(
        datasource,
        resolvedTemplate,
        document.data
      );
      // console.log(JSON.stringify(template, null, 2));

      return {
        __typename: template.label,
        content: "\nSome content\n",
        form: resolvedTemplate,
        data: resolvedData,
      };
    default:
      return value;
  }
};

export const graphqlInit = async (args: {
  schema: GraphQLSchema;
  source: string | Source;
  contextValue: ContextT;
  variableValues: { path: string };
}) => {
  return await graphql({
    ...args,
    // @ts-ignore
    fieldResolver: fieldResolver,
    typeResolver: documentTypeResolver,
    rootValue: { document: { _resolver: "_initial_source" } },
  });
};

const resolveTemplate = async (
  datasource: DataSource,
  template: TemplateData
) => {
  const accum = {
    __typename: template.label,
    ...template,
    fields: [],
  };

  await Promise.all(
    template.fields.map(async (field) =>
      accum.fields.push(await resolveField(datasource, field))
    )
  );

  return accum;
};

const resolveField = async (datasource: DataSource, field: Field) => {
  switch (field.type) {
    case "textarea":
      return await textarea.resolvers.formFieldBuilder(field);
    case "blocks":
      return await blocks.resolvers.formFieldBuilder(
        datasource,
        field,
        resolveTemplate
      );
    case "select":
      return await select.resolvers.formFieldBuilder(datasource, field);
    case "list":
      return await list.resolvers.formFieldBuilder(datasource, field);
    case "field_group":
      return await fieldGroup.resolvers.formFieldBuilder(
        datasource,
        field,
        resolveField
      );
    case "field_group_list":
      return await fieldGroupList.resolvers.formFieldBuilder(
        datasource,
        field,
        resolveField
      );
    default:
      console.log(field);
      return field;
  }
};

const resolveData = async (
  datasource: DataSource,
  resolvedTemplate: TemplateData,
  data
) => {
  const fields = {};
  const dataKeys = Object.keys(data);

  await Promise.all(
    dataKeys.map(async (key) => {
      const field = resolvedTemplate.fields.find((f) => f.name === key);
      const value = data[key];
      return (fields[key] = await resolveDataField(datasource, field, value));
    })
  );
  return {
    __typename: `${resolvedTemplate.label}Data`,
    ...fields,
  };
};

const resolveDataField = async (
  datasource: DataSource,
  field: Field,
  value
) => {
  switch (field.type) {
    case "textarea":
      return await textarea.resolvers.dataFieldBuilder(
        datasource,
        field,
        value
      );
    case "blocks":
      return await blocks.resolvers.dataFieldBuilder(
        datasource,
        field,
        value,
        resolveData
      );
    case "select":
      return {
        __typename: field.label,
        _resolver: "select_data",
        field,
        value,
      };
    case "list":
      return await list.resolvers.dataFieldBuilder(datasource, field, value);
    case "field_group":
      return await fieldGroup.resolvers.dataFieldBuilder(
        datasource,
        field,
        value,
        resolveData
      );
    case "field_group_list":
      return await fieldGroupList.resolvers.dataFieldBuilder(
        datasource,
        field,
        value,
        resolveData
      );
    default:
      console.warn(field.type, value);
      return value;
  }
};
