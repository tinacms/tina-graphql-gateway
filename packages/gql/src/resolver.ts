import { graphql } from "graphql";
import { GraphQLSchema, GraphQLFieldResolver, Source } from "graphql";
import type { TinaField } from "./fields";
import _ from "lodash";
import type { TemplateData, TinaTemplateData, WithFields } from "./types";
import type { Field } from "./fields";
import { text } from "./fields/text";
import { textarea } from "./fields/textarea";
import { select } from "./fields/select";
import { list } from "./fields/list";
import { blocks } from "./fields/blocks";
import { fieldGroup } from "./fields/field-group";
import { fieldGroupList } from "./fields/field-group-list";
import type { DataSource } from "./datasources/datasource";
import { FileSystemManager } from "./datasources/filesystem-manager";

export type ContextT = {
  datasource: DataSource;
};

type FieldResolverArgs = { [argName: string]: unknown };

/**
 * Each document request should populate these reserved
 * properties so we know how to delegate them, for fields
 * list "select" fields which reference another document
 * it is responsible for providing these in the field
 * value resolver
 */
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

function isResource(
  item: unknown | FieldResolverSource
): item is InitialSource {
  if (typeof item === "object") {
    return !!item && item.hasOwnProperty("_resolver");
  } else {
    return false;
  }
}

export const fieldResolver: GraphQLFieldResolver<
  FieldResolverSource,
  ContextT,
  FieldResolverArgs
> = async (source, args, context, info) => {
  const value = source[info.fieldName];
  const { datasource } = context;

  if (info.fieldName === "updateDocument") {
    if (!args.path || typeof args.path !== "string") {
      throw new Error(`Expected args for initial document request`);
    }
    await resolveDocumentInput({ args: args, params: args.params, datasource });
    return await resolveDocument({ args: args, datasource });
  }

  if (!value) {
    return null;
  }
  if (isResource(value)) {
    switch (value._resolver_kind) {
      case "_initial":
        if (!args.path || typeof args.path !== "string") {
          throw new Error(`Expected args for initial document request`);
        }
        return resolveDocument({ args: { path: args.path }, datasource });
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
  form: TinaTemplateData;
  path: string;
  data: ResolvedData;
  initialValues: ResolvedData;
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
  const resolvedData = await resolveData(datasource, template, data);
  const resolvedInitialValues = await resolveInitialValues(
    datasource,
    template,
    data
  );

  return {
    __typename: template.label,
    path: args.path,
    content: "\nSome content\n",
    form: resolvedTemplate,
    data: resolvedData,
    initialValues: resolvedInitialValues,
  };
};

const resolveDocumentInputData = async ({
  data,
  template,
  datasource,
}: {
  data: { [key: string]: unknown };
  template: TemplateData;
  datasource: DataSource;
}): Promise<{ _template: string } & object> => {
  const accum: { [key: string]: unknown } = {};
  await Promise.all(
    template.fields.map(async (field) => {
      const value = data[field.name];
      switch (field.type) {
        case "text":
          accum[field.name] = await text.resolve.input({
            datasource,
            field,
            value,
          });
          break;
        case "textarea":
          accum[field.name] = await textarea.resolve.input({
            datasource,
            field,
            value,
          });

          break;
        case "blocks":
          accum[field.name] = await blocks.resolve.input({
            datasource,
            field,
            value,
            resolveData,
            resolveTemplate,
            resolveDocumentInputData,
          });

          break;
        case "select":
          accum[field.name] = await select.resolve.input({
            datasource,
            field,
            value,
          });
          break;
        case "list":
          accum[field.name] = await list.resolve.input({
            datasource,
            field,
            value,
          });
          break;
        case "field_group":
          accum[field.name] = await fieldGroup.resolve.input({
            datasource,
            field,
            value,
            resolveData,
            resolveDocumentInputData,
          });
          break;
        case "field_group_list":
          accum[field.name] = await fieldGroupList.resolve.input({
            datasource,
            field,
            value,
            resolveData,
            resolveDocumentInputData,
          });

        default:
          accum[field.name] = value;
          break;
      }
    })
  );

  return {
    _template: template.label,
    ...accum,
  };
};

const resolveDocumentInput = async ({
  args,
  params,
  datasource,
}: {
  args: { path: string };
  params: object;
  datasource: DataSource;
}): Promise<boolean> => {
  const template = await datasource.getTemplateForDocument(args);

  // FIXME: we should validate that only one key was passed
  const data = Object.values(params)[0].data;

  const { _template, ...value } = await resolveDocumentInputData({
    data,
    template,
    datasource,
  });

  const payload = {
    data: value,
  };
  await datasource.updateDocument({ path: args.path, params: payload });

  return true;
};

export const graphqlInit = async (args: {
  schema: GraphQLSchema;
  source: string | Source;
  contextValue: ContextT;
  variableValues: { path: string };
}) => {
  return await graphql({
    ...args,
    fieldResolver: fieldResolver,
    rootValue: {
      document: {
        _resolver: "_resource",
        _resolver_kind: "_initial",
      },
    },
  });
};

export type resolveTemplateType = (
  datasource: DataSource,
  template: TemplateData
) => Promise<TinaTemplateData>;
const resolveTemplate: resolveTemplateType = async (datasource, template) => {
  return {
    __typename: template.label,
    // FIXME: this should be slug but we should store it on the template definition
    _template: template.label,
    ...template,
    fields: await Promise.all(
      template.fields.map(async (field) => resolveField(datasource, field))
    ),
  };
};

export type resolveFieldType = (
  datasource: DataSource,
  field: Field
) => Promise<TinaField>;
const resolveField: resolveFieldType = async (datasource, field) => {
  switch (field.type) {
    case "text":
      return await text.resolve.field({ field });
    case "textarea":
      return await textarea.resolve.field({ field });
    case "blocks":
      return await blocks.resolve.field({ datasource, field, resolveTemplate });
    case "select":
      return await select.resolve.field({ datasource, field });
    case "list":
      return await list.resolve.field({ datasource, field });
    case "field_group":
      return await fieldGroup.resolve.field({
        datasource,
        field,
        resolveField,
      });
    case "field_group_list":
      return await fieldGroupList.resolve.field({
        datasource,
        field,
        resolveField,
      });
    default:
      throw new Error(`Unexpect`);
  }
};
const resolveDataField = async (
  datasource: DataSource,
  field: Field,
  value: unknown
) => {
  switch (field.type) {
    case "text":
      return text.resolve.value({ datasource, field, value });
    case "textarea":
      return textarea.resolve.value({ datasource, field, value });
    case "blocks":
      return blocks.resolve.value({
        datasource,
        field,
        value,
        resolveData,
        resolveTemplate,
      });
    case "select":
      return select.resolve.value({ datasource, field, value });
    case "list":
      return list.resolve.value({ datasource, field, value });
    case "field_group":
      return fieldGroup.resolve.value({
        datasource,
        field,
        value,
        resolveData,
      });
    case "field_group_list":
      return fieldGroupList.resolve.value({
        datasource,
        field,
        value,
        resolveData,
      });
  }
};
const resolveInitialValuesField = async (
  datasource: DataSource,
  field: Field,
  value: unknown
) => {
  switch (field.type) {
    case "text":
      return text.resolve.initialValue({ datasource, field, value });
    case "textarea":
      return textarea.resolve.initialValue({ datasource, field, value });
    case "blocks":
      return blocks.resolve.initialValue({
        datasource,
        field,
        value,
        resolveInitialValues,
        resolveTemplate,
      });
    case "select":
      return select.resolve.initialValue({ datasource, field, value });
    case "list":
      return list.resolve.initialValue({ datasource, field, value });
    case "field_group":
      return fieldGroup.resolve.initialValue({
        datasource,
        field,
        value,
        resolveData,
      });
    case "field_group_list":
      return fieldGroupList.resolve.initialValue({
        datasource,
        field,
        value,
        resolveData,
      });
  }
};
export interface ResolvedData {
  [key: string]: Field | string;
}
export type resolveDataType = (
  datasource: DataSource,
  field: WithFields,
  data: {
    [key: string]: unknown;
  }
) => Promise<ResolvedData>;
const resolveData: resolveDataType = async (
  datasource,
  resolvedTemplate,
  data
) => {
  const accum: { [key: string]: unknown } = {};
  await Promise.all(
    Object.keys(data).map(async (key) => {
      const field = findField(resolvedTemplate.fields, key);
      return (accum[key] = await resolveDataField(
        datasource,
        field,
        data[key]
      ));
    })
  );
  return {
    __typename: `${resolvedTemplate.label}Data`,
    ...accum,
  };
};
export interface ResolveInitialValues {
  [key: string]: Field | string;
}
export type resolveInitialValuesType = (
  datasource: DataSource,
  field: WithFields,
  data: {
    [key: string]: unknown;
  }
) => Promise<ResolvedData>;
const resolveInitialValues: resolveInitialValuesType = async (
  datasource,
  resolvedTemplate,
  data
) => {
  const accum: { [key: string]: unknown } = {};
  await Promise.all(
    Object.keys(data).map(async (key) => {
      const field = findField(resolvedTemplate.fields, key);
      return (accum[key] = await resolveInitialValuesField(
        datasource,
        field,
        data[key]
      ));
    })
  );
  return {
    __typename: `${resolvedTemplate.label}InitialValues`,
    ...accum,
  };
};
const findField = (fields: Field[], fieldName: string) => {
  const field = fields.find((f) => f.name === fieldName);
  if (!field) {
    throw new Error(`Unable to find field for item with name: ${name}`);
  }
  return field;
};
