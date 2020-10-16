import _ from "lodash";

import { text } from "../fields/text";
import { list } from "../fields/list";
import { select } from "../fields/select";
import { blocks } from "../fields/blocks";
import { textarea } from "../fields/textarea";
import { fieldGroup } from "../fields/field-group";
import { fieldGroupList } from "../fields/field-group-list";
import { boolean } from "../fields/boolean";
import { datetime } from "../fields/datetime";
import { file } from "../fields/file";
import { imageGallery } from "../fields/image-gallery";
import { number } from "../fields/number";
import { tag_list } from "../fields/tag-list";
import { friendlyName } from "@forestryio/graphql-helpers";

import { sequential } from "../util";
import type { Field } from "../fields";
import type { DataSource } from "../datasources/datasource";
import type { TemplateData, TinaTemplateData } from "../types";
import type { GraphQLResolveInfo } from "graphql";

export interface Resolver {
  /**
   * The values required to mutate the document
   *
   * ```json
   * {
   *  "_template": "Post",
   *  "title": "Some Title",
   *  "author": "authors/homer.md",
   * }
   * ```
   *
   * See {@link Builder.documentDataInputObject} for the equivalent builder
   */
  documentDataInputObject: (args: {
    data: { [key: string]: unknown };
    template: TemplateData;
    datasource: DataSource;
  }) => Promise<{
    [key: string]: unknown;
  }>;
  /**
   * Given a template and document data, return the resolved data along with the `_template` and `__typename`
   * so it can be resolved by the GraphQL type resolver
   *
   * Notice in the below example the `author` key doesn't actually have the resolved author. This is because
   * we're relying on GraphQL to call the field resolver on each key the user asks for. So in this scenario
   * we won't get the author document until we know the user has asked for it in their query.
   *
   * If we were to fetch the author document at this stage, we are possibly over-fetching data that we'll never return
   * to the user.
   *
   * Another important note - this function returns some things which are not needed by the end result. If you look at the [builder]({@link Builder.documentDataObject})
   * for this function, it doesn't have a requirement for `__typename` or `_template` - these values are used internally by subsequent
   * `resolver` calls. Since field resolvers work like a waterfall, these values will be used downstream, and won't end up being returned
   * to the end user.
   *
   * ```json
   * {
   *   "__typename": "PostData",
   *   "_template": "Post",
   *   "title": "Some Title",
   *   "author": {
   *     "_resolver": "_resource",
   *     "_resolver_kind": "_nested_source",
   *     "_args": {
   *       "path": "authors/homer.md"
   *     }
   *   }
   * }
   * ```
   *
   * See {@link Builder.documentDataObject} for the equivalent builder
   */
  documentDataObject: (args: {
    datasource: DataSource;
    resolvedTemplate: TemplateData;
    data: DocumentData;
    includeContent?: boolean;
    content?: string | undefined;
  }) => Promise<unknown>;
  /**
   *
   * The top-level form type for a document
   *
   * ```json
   * {
   *   "label": "Post",
   *   "hide_body": false,
   *   "display_field": "title",
   *   "fields": [
   *     {
   *       "name": "title",
   *       "label": "Title",
   *       "description": "The name of your post, keep it short!",
   *       "config": {
   *         "required": false
   *       },
   *       "component": "textarea",
   *       "__namespace": "Post",
   *       "__typename": "TextareaField"
   *     },
   *     {
   *       "name": "author",
   *       "config": {
   *         "required": false,
   *         "source": {
   *          "type": "pages",
   *           "section": "authors"
   *         }
   *       },
   *       "label": "Author",
   *       "component": "select",
   *       "__namespace": "Post",
   *       "__typename": "SelectField",
   *      "options": [
   *         "authors/marge.md",
   *         "authors/homer.md"
   *       ]
   *     },
   *   }
   * }
   * ```
   *
   * See {@link Builder.documentFormObject} for the equivalent builder
   */
  documentFormObject: (
    datasource: DataSource,
    template: TemplateData
  ) => Promise<TinaTemplateData>;
  /**
   * Given a template and document data, return the appropriate initialValues along with the _template and __typename
   *
   * ```json
   * {
   *   "__typename": "PostInitialValues",
   *   "_template": "Post",
   *   "title": "Some Title",
   *   "author": "authors/homer.md"
   * }
   * ```
   *
   * See {@link Builder.documentInitialValuesObject} for the equivalent builder
   */
  documentInitialValuesObject: (
    datasource: DataSource,
    resolvedTemplate: TemplateData,
    data: DocumentData,
    includeContent?: boolean,
    content?: string
  ) => Promise<{
    __typename: string;
    _template?: string;
    [key: string]: unknown;
  }>;
  /**
   * Builds the JSON representation of the file being written, this value is passed to the
   * DataSource which persists the data, the return value is not used
   *
   * ```json
   * {
   *   "data": {
   *     "title": "Some Title",
   *     "author": "authors/homer.md",
   *   },
   *   "content": ""
   * }
   * ```
   * See {@link Builder.documentInputObject} for the equivalent builder
   */
  documentInputObject: (params: {
    args: { path: string };
    params: object;
    datasource: DataSource;
  }) => Promise<boolean>;
  /**
   *
   * The top-level return value
   *
   * ```json
   * {
   *   "__typename": "Post",
   *   "path": "posts/1.md",
   *   "content": "",
   *   "form": {...}
   *   "data": {...}
   *   "initialValues": {...}
   * }
   * ```
   *
   * See {@link Builder.documentObject} for the equivalent builder
   */
  documentObject: (args: {
    args: { path: string };
    datasource: DataSource;
  }) => Promise<unknown>;
  schema: (
    source: FieldResolverSource,
    args: FieldResolverArgs,
    context: ContextT,
    info: GraphQLResolveInfo
  ) => Promise<unknown>;
}

/**
 * @internal this is redundant in documentation
 */
export const resolver: Resolver = {
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

      await resolver.documentInputObject({
        args: args,
        params: args.params,
        datasource,
      });
      return await resolver.documentObject({
        args: args,
        datasource,
      });
    }

    if (!value) {
      return null;
    }
    /**
     * Field-level references return an object with "instructions" rather than the document themselves.
     *
     * The reason for this is if you have `post->author`, we don't want to actually fetch the author
     * document until we know you need it, so when we come across the author reference in the post's
     * frontmatter, we return instructions for how to retrieve that document
     */
    if (isDocumentField(value)) {
      switch (value._resolver_kind) {
        case "_initial":
          if (!args.path || typeof args.path !== "string") {
            throw new Error(`Expected args for initial document request`);
          }
          return resolver.documentObject({
            args: { path: args.path, ...args },
            datasource,
          });
        case "_nested_source":
          return await resolver.documentObject({
            args: value._args,
            datasource,
          });
        case "_nested_sources":
          return await sequential(value._args.paths, async (p) => {
            return await resolver.documentObject({
              args: { path: p, ...args },
              datasource,
            });
          });
      }
    } else {
      /**
       * This is where we support fields with arguments, we return `_value` along with the field
       * type so we know which field to pass in for the argument format
       */
      if (isEnrichedValue(value)) {
        switch (value.field.type) {
          case "textarea":
            // if (args.format) {
            // if (args.format === "html") {
            //   const contents = await mdx.plainCompile({
            //     contents: value._value,
            //   });
            //   // FIXME: not working
            //   console.log(contents);
            //   return value._value;
            // }
            // if (args.format === "markdown") {
            //   const contents = await mdx.mdCompile({
            //     contents: value._value,
            //   });
            //   return JSON.stringify(contents, null, 2);
            // }
            // }
            return value._value;
          default:
            return value._value;
        }
      }
      return value;
    }
  },
  documentObject: async ({ args, datasource }) => {
    const { data, content } = await datasource.getData(args);
    const template = await datasource.getTemplateForDocument(args);

    return {
      __typename: friendlyName(template),
      path: args.path,
      content: "\nSome content\n",
      form: await resolver.documentFormObject(datasource, template),
      data: await resolver.documentDataObject({
        datasource,
        resolvedTemplate: template,
        data,
        includeContent: true,
        content,
      }),
      initialValues: await resolver.documentInitialValuesObject(
        datasource,
        template,
        data,
        true,
        content || ""
      ),
    };
  },
  documentDataObject: async ({
    datasource,
    resolvedTemplate,
    data,
    includeContent,
    content,
  }) => {
    const accum: { [key: string]: unknown } = {};
    const { template, ...rest } = data;
    await sequential(Object.keys(rest), async (key) => {
      const field = findField(resolvedTemplate.fields, key);
      return (accum[key] = await dataValue(datasource, field, rest[key]));
    });

    if (includeContent) {
      // accum.content = textarea.resolve.value({
      //   datasource,
      //   field: textarea.contentField,
      //   value: content,
      // });
    }

    return {
      __typename: friendlyName(template, "Data"),
      ...accum,
    };
  },
  documentInitialValuesObject: async (
    datasource,
    resolvedTemplate,
    data,
    includeContent = false,
    content
  ) => {
    const accum: { [key: string]: unknown } = {};

    const { template, ...rest } = data;

    await sequential(Object.keys(rest), async (key) => {
      const field = findField(resolvedTemplate.fields, key);
      return (accum[key] = await dataInitialValuesField(
        datasource,
        field,
        data[key]
      ));
    });

    if (includeContent) {
      // accum["content"] = content;
    }

    return {
      __typename: friendlyName(resolvedTemplate, "InitialValues"),
      _template: data.template,
      ...accum,
    };
  },
  documentFormObject: async (
    datasource: DataSource,
    template: TemplateData
  ) => {
    const fields = await sequential(template.fields, async (field) =>
      dataField(datasource, field)
    );

    if (true) {
      // fields.push(
      //   await textarea.resolve.field({
      //     datasource,
      //     field: textarea.contentField,
      //   })
      // );
    }

    return {
      ...template,
      fields,
    };
  },
  documentDataInputObject: async ({ data, template, datasource }) => {
    const accum: { [key: string]: unknown } = {};
    await sequential(template.fields, async (field) => {
      const value = data[field.name];
      // TODO: if value is undefined the function
      // shouldn't be called, but this should probably
      // be handled in the schema builder to decide if
      // the field is required AND doesn't exist
      if (!value) {
        return null;
      }
      accum[field.name] = await documentInputDataField({
        datasource,
        field,
        value,
      });
    });
    return accum;
  },
  documentInputObject: async ({
    args,
    params,
    datasource,
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
      content: "", // TODO: Implement me
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
    case "boolean":
      return await boolean.resolve.initialValue({ datasource, field, value });
    case "datetime":
      return await datetime.resolve.initialValue({ datasource, field, value });
    case "file":
      return await file.resolve.initialValue({ datasource, field, value });
    case "image_gallery":
      return await imageGallery.resolve.initialValue({
        datasource,
        field,
        value,
      });
    case "number":
      return await number.resolve.initialValue({ datasource, field, value });
    case "tag_list":
      return await tag_list.resolve.initialValue({ datasource, field, value });
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
    case "boolean":
      return await boolean.resolve.value({ datasource, field, value });
    case "datetime":
      return await datetime.resolve.value({ datasource, field, value });
    case "file":
      return await file.resolve.value({ datasource, field, value });
    case "image_gallery":
      return await imageGallery.resolve.value({ datasource, field, value });
    case "number":
      return await number.resolve.value({ datasource, field, value });
    case "tag_list":
      return await tag_list.resolve.value({ datasource, field, value });
  }
};
const dataField = async (datasource: DataSource, field: Field) => {
  switch (field.type) {
    case "text":
      return await text.resolve.field({ datasource, field });
    case "textarea":
      return await textarea.resolve.field({ datasource, field });
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
    case "boolean":
      return await boolean.resolve.field({ datasource, field });
    case "datetime":
      return await datetime.resolve.field({ datasource, field });
    case "file":
      return await file.resolve.field({ datasource, field });
    case "image_gallery":
      return await imageGallery.resolve.field({ datasource, field });
    case "number":
      return await number.resolve.field({ datasource, field });
    case "tag_list":
      return await tag_list.resolve.field({ datasource, field });
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
    case "boolean":
      return await boolean.resolve.input({ datasource, field, value });
    case "datetime":
      return await datetime.resolve.input({ datasource, field, value });
    case "file":
      return await file.resolve.input({ datasource, field, value });
    case "image_gallery":
      return await imageGallery.resolve.input({ datasource, field, value });
    case "number":
      return await number.resolve.input({ datasource, field, value });
    case "tag_list":
      return await tag_list.resolve.input({ datasource, field, value });
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

function isDocumentField(
  item: unknown | FieldResolverSource
): item is InitialSource {
  if (typeof item === "object") {
    return !!item && item.hasOwnProperty("_resolver");
  } else {
    return false;
  }
}

function isEnrichedValue(
  item: unknown
): item is { _value: string; field: Field } {
  if (typeof item === "object" && item !== null) {
    if (item.hasOwnProperty("_value")) {
      return true;
    }
  }

  return false;
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
  /** Only required for data coming from block values */
  template?: string;
};
