import { graphql } from "graphql";
import { GraphQLSchema, GraphQLFieldResolver, Source } from "graphql";
import _ from "lodash";
import type { TemplateData } from "./types";
import type { Field } from "./fields";
import { text } from "./fields/text";
import { textarea } from "./fields/textarea";
import { select } from "./fields/select";
import { list } from "./fields/list";
import { blocks } from "./fields/blocks";
import { fieldGroup } from "./fields/field-group";
import { fieldGroupList } from "./fields/field-group-list";
import type { DataSource } from "./datasources/datasource";

export type ContextT = {
  datasource: DataSource;
};

type FieldResolverArgs = undefined | { path: string };

export type InitialSource =
  | {
      _resolver: "_resource";
      _resolver_kind: "_initial";
    }
  | {
      _resolver: "_resource";
      _resolver_kind: "_nested_source";
      _args: { path: string };
    }
  | {
      _resolver: "_resource";
      _resolver_kind: "_nested_sources";
      _args: { paths: string[] };
    };

type FieldResolverSource = {
  [key: string]: InitialSource | unknown;
};

function isResource(item: unknown): item is InitialSource {
  return typeof item._resolver === "string";
}

export const fieldResolver: GraphQLFieldResolver<
  FieldResolverSource,
  ContextT,
  FieldResolverArgs
> = async (source, args, context, info) => {
  const value = source[info.fieldName];
  const { datasource } = context;

  if (!value) {
    return null;
  }
  if (isResource(value)) {
    switch (value._resolver_kind) {
      case "_initial":
        if (!args) {
          throw new Error(`Expected args for initial document request`);
        }
        return resolveDocument({ args: args, datasource });
      case "_nested_source":
        return {
          document: await resolveDocument({ args: value._args, datasource }),
        };
      case "_nested_sources":
        return {
          documents: await Promise.all(
            value._args.paths.map(async (p) => {
              return await resolveDocument({ args: { path: p }, datasource });
            })
          ),
        };
    }
  } else {
    return value;
  }
};

type ResolveDocument = {
  __typename: string;
  content: string;
  form: ResolvedTemplate;
  path: string;
  data: ResolvedData;
};
const resolveDocument = async ({
  args,
  datasource,
}: {
  args: { path: string };
  datasource: DataSource;
}): Promise<ResolveDocument> => {
  const { data } = await datasource.getData(args);
  const template = await datasource.getTemplateForDocument(args);
  const resolvedTemplate = await resolveTemplate(datasource, template);
  const resolvedData = await resolveData(datasource, resolvedTemplate, data);

  return {
    __typename: template.label,
    path: args.path,
    content: "\nSome content\n",
    form: resolvedTemplate,
    data: resolvedData,
  };
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
    rootValue: {
      document: {
        _resolver: "_resource",
        _resolver_kind: "_initial",
      },
    },
  });
};

type ResolvedTemplate = TemplateData & {
  __typename: string;
  fields: Field[];
};

export type resolveTemplateType = (
  datasource: DataSource,
  template: TemplateData
) => Promise<ResolvedTemplate>;
const resolveTemplate: resolveTemplateType = async (datasource, template) => {
  return {
    __typename: template.label,
    ...template,
    fields: await Promise.all(
      template.fields.map(async (field) => resolveField(datasource, field))
    ),
  };
};

export type resolveFieldType = (
  datasource: DataSource,
  field: Field
) => Promise<any>;
const resolveField: resolveFieldType = async (datasource, field) => {
  switch (field.type) {
    case "textarea":
      return textarea.resolve.field(field);
    case "blocks":
      return blocks.resolve.field(datasource, field, resolveTemplate);
    case "select":
      return select.resolvers.formFieldBuilder(datasource, field);
    case "list":
      return list.resolvers.formFieldBuilder(datasource, field);
    case "field_group":
      return fieldGroup.resolve.field(datasource, field, resolveField);
    case "field_group_list":
      return fieldGroupList.resolve.field(datasource, field, resolveField);
    default:
      console.log(field);
      return field;
  }
};

type ResolvedData = {
  __typename: string;
  [key: string]: Field;
};
export type resolveDataType = (
  datasource: DataSource,
  field: TemplateData,
  data: {
    [key: string]: unknown;
  }
) => Promise<ResolvedData>;
const resolveData: resolveDataType = async (
  datasource,
  resolvedTemplate,
  data
) => {
  await Promise.all(
    Object.keys(data).map(async (key) => {
      const field = findField(resolvedTemplate.fields, key);
      return (data[key] = await resolveDataField(datasource, field, data[key]));
    })
  );
  return {
    __typename: `${resolvedTemplate.label}Data`,
    ...data,
  };
};

const resolveDataField = async (
  datasource: DataSource,
  field: Field,
  value: unknown
) => {
  switch (field.type) {
    case "textarea":
      return textarea.resolve.value(datasource, field, value);
    case "blocks":
      return blocks.resolve.value(datasource, field, value, resolveData);
    case "select":
      return select.resolvers.dataFieldBuilder(datasource, field, value);
    case "list":
      return list.resolvers.dataFieldBuilder(datasource, field, value);
    case "field_group":
      return fieldGroup.resolve.value(datasource, field, value, resolveData);
    case "field_group_list":
      return fieldGroupList.resolve.value(
        datasource,
        field,
        value,
        resolveData
      );
    default:
      throw new Error(
        `Unexpected type for data field resolver - ${field.type}`
      );
  }
};

const findField = (fields: Field[], fieldName: string) => {
  const field = fields.find((f) => f.name === fieldName);
  if (!field) {
    throw new Error(`Unable to find field for item with name: ${name}`);
  }
  return field;
};
