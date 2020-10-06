import _ from "lodash";

import { text } from "../fields/text";
import { list } from "../fields/list";
import { select } from "../fields/select";
import { blocks } from "../fields/blocks";
import { textarea } from "../fields/textarea";
import { fieldGroup } from "../fields/field-group";
import { fieldGroupList } from "../fields/field-group-list";

import type { Field } from "../fields";
import type { DataSource } from "../datasources/datasource";
import type { TemplateData } from "../types";
import type { GraphQLResolveInfo } from "graphql";

export const resolver = {
  schema: async (
    source: FieldResolverSource,
    args: FieldResolverArgs,
    context: ContextT,
    info: GraphQLResolveInfo
  ) => {
    const value = source[info.fieldName];
    const { datasource } = context;

    if (info.fieldName === "updateDocument") {
      assertIsDocumentInputArgs(args);

      await resolver.sectionDocumentInputObject({
        args: args,
        params: args.params,
        datasource,
      });
      return await resolver.documentObject({ args: args, datasource });
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
          return resolver.documentObject({
            args: { path: args.path },
            datasource,
          });
        case "_nested_source":
          return {
            document: await resolver.documentObject({
              args: value._args,
              datasource,
            }),
          };
        case "_nested_sources":
          return {
            documents: await Promise.all(
              value._args.paths.map(async (p) => {
                return await resolver.documentObject({
                  args: { path: p },
                  datasource,
                });
              })
            ),
          };
      }
    } else {
      return value;
    }
  },
  /**
   * Retrieves the top-level document and provides the __typename so it can be resolved automatically
   * by the GraphQL type resolver
   */
  documentObject: async ({
    args,
    datasource,
  }: {
    args: { path: string };
    datasource: DataSource;
  }): Promise<unknown> => {
    const { data } = await datasource.getData(args);
    const template = await datasource.getTemplateForDocument(args);

    return {
      __typename: template.label,
      path: args.path,
      content: "\nSome content\n",
      form: await resolver.documentFormObject(datasource, template),
      data: await resolver.documentDataObject(datasource, template, data),
      initialValues: await resolver.documentInitialValuesObject(
        datasource,
        template,
        data
      ),
    };
  },
  /**
   * Given a template and document data, return the resolved data along with the _template and __typename
   * so it can be resolved by the GraphQL type resolver
   */
  documentDataObject: async (
    datasource: DataSource,
    resolvedTemplate: TemplateData,
    data: DocumentData
  ) => {
    const accum: { [key: string]: unknown } = {};
    const { _template, ...rest } = data;
    await Promise.all(
      Object.keys(rest).map(async (key) => {
        const field = findField(resolvedTemplate.fields, key);
        return (accum[key] = await dataValue(datasource, field, rest[key]));
      })
    );
    return {
      __typename: `${resolvedTemplate.label}Data`,
      _template: resolvedTemplate.label,
      ...accum,
    };
  },
  /**
   * Given a template and document data, return the appropriate initialValues along with the _template and __typename
   */
  documentInitialValuesObject: async (
    datasource: DataSource,
    resolvedTemplate: TemplateData,
    data: DocumentData
  ) => {
    const accum: { [key: string]: unknown } = {};
    await Promise.all(
      Object.keys(data).map(async (key) => {
        const field = findField(resolvedTemplate.fields, key);
        return (accum[key] = await dataInitialValuesField(
          datasource,
          field,
          data[key]
        ));
      })
    );
    return {
      __typename: `${resolvedTemplate.label}InitialValues`,
      _template: resolvedTemplate.label,
      ...accum,
    };
  },
  documentFormObject: async (
    datasource: DataSource,
    template: TemplateData
  ) => {
    return {
      ...template,
      // FIXME: this should be slug but we should store it on the template definition
      _template: template.label,
      fields: await Promise.all(
        template.fields.map(async (field) => dataField(datasource, field))
      ),
    };
  },
  documentDataInputObject: async ({
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
        accum[field.name] = await documentInputDataField({
          datasource,
          field,
          value,
        });
      })
    );
    return {
      _template: template.label,
      ...accum,
    };
  },
  sectionDocumentInputObject: async ({
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

    const { _template, ...value } = await resolver.documentDataInputObject({
      data,
      template,
      datasource,
    });

    const payload = {
      data: value,
    };
    await datasource.updateDocument({ path: args.path, params: payload });

    return true;
  },
};

const dataInitialValuesField = async (
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
      return blocks.resolve.initialValue({ datasource, field, value });
    case "select":
      return select.resolve.initialValue({ datasource, field, value });
    case "list":
      return list.resolve.initialValue({ datasource, field, value });
    case "field_group":
      return fieldGroup.resolve.initialValue({ datasource, field, value });
    case "field_group_list":
      return fieldGroupList.resolve.initialValue({
        datasource,
        field,
        value,
      });
  }
};
const dataValue = async (
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
      return blocks.resolve.value({ datasource, field, value });
    case "select":
      return select.resolve.value({ datasource, field, value });
    case "list":
      return list.resolve.value({ datasource, field, value });
    case "field_group":
      return fieldGroup.resolve.value({ datasource, field, value });
    case "field_group_list":
      return fieldGroupList.resolve.value({
        datasource,
        field,
        value,
      });
  }
};
export const dataField = async (datasource: DataSource, field: Field) => {
  switch (field.type) {
    case "text":
      return await text.resolve.field({ field });
    case "textarea":
      return await textarea.resolve.field({ field });
    case "blocks":
      return await blocks.resolve.field({ datasource, field });
    case "select":
      return await select.resolve.field({ datasource, field });
    case "list":
      return await list.resolve.field({ datasource, field });
    case "field_group":
      return await fieldGroup.resolve.field({ datasource, field });
    case "field_group_list":
      return await fieldGroupList.resolve.field({
        datasource,
        field,
      });
  }
};
const documentInputDataField = async ({
  datasource,
  field,
  value,
}: {
  datasource: DataSource;
  field: Field;
  value: unknown;
}) => {
  switch (field.type) {
    case "text":
      return await text.resolve.input({ datasource, field, value });
    case "textarea":
      return await textarea.resolve.input({ datasource, field, value });
    case "blocks":
      return await blocks.resolve.input({ datasource, field, value });
    case "select":
      return await select.resolve.input({ datasource, field, value });
    case "list":
      return await list.resolve.input({ datasource, field, value });
    case "field_group":
      return await fieldGroup.resolve.input({ datasource, field, value });
    case "field_group_list":
      return await fieldGroupList.resolve.input({ datasource, field, value });
  }
};

const findField = (fields: Field[], fieldName: string) => {
  const field = fields.find((f) => {
    return f?.name === fieldName;
  });
  if (!field) {
    throw new Error(`Unable to find field for item with name: ${fieldName}`);
  }
  return field;
};

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

function assertIsDocumentInputArgs(
  args: FieldResolverArgs
): asserts args is { path: string; params: object } {
  if (!args.path || typeof args.path !== "string") {
    throw new Error(`Expected args for input document request`);
  }
  if (!args.params || typeof args.params !== "object") {
    throw new Error(`Expected args for input document request`);
  }
}

type DocumentData = {
  [key: string]: unknown;
};
