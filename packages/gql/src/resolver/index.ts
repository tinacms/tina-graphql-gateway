import _ from "lodash";
import { graphql } from "graphql";
import path from "path";
import { assertShape, sequential } from "../util";
import { templateTypeName, friendlyName } from "@forestryio/graphql-helpers";

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

import type { DataSource } from "../datasources/datasource";
import type { GraphQLSchema, GraphQLResolveInfo, Source } from "graphql";
import type { DirectorySection } from "../types";
import type { Field } from "../fields";
import type { sectionMap } from "../builder";
import type { TemplateData } from "../types";

export const graphqlInit = async (a: {
  schema: GraphQLSchema;
  source: string | Source;
  contextValue: ContextT;
  variableValues: object;
  sectionMap: sectionMap;
}) => {
  const { sectionMap, ...rest } = a;
  return await graphql({
    ...rest,
    fieldResolver: async (
      source: FieldResolverSource,
      args: FieldResolverArgs,
      context: ContextT,
      info: GraphQLResolveInfo
    ) => {
      return schemaResolver(source, args, context, info, sectionMap);
    },
    rootValue: { _resolver_kind: null },
  });
};

/**
 * The `schemaResolver` function runs for __every__ field we process for queries and mutations.
 *
 * That means that for this query:
 *
 * ```graphql
 * {
 *  getPagesList {
 *    id
 *    sys {
 *      relativePath
 *      breadcrumbs(excludeExtension: true)
 *    }
 *    data {
 *      ...on BlockPage_Doc_Data {
 *        title
 *      }
 *    }
 *  }
 * }
 * ```
 *
 * This same function gets called with `info.fieldName` values of `id`, `sys`, `relativePath`, `breadcrumbs`
 * `data` and `title`. If nothing is provided, that `source[info.fieldName]`
 * value will be used, that is to say, if the ancestor of `relativePath` (`sys`) returns:
 *
 * ```json
 * "sys": {
 *   "relativePath": "about.md",
 *   "breadcrumbs": [
 *     "about"
 *   ]
 * }
 * ```
 *
 * Then we can allow the `relativePath` call to do nothing but pass it's value (`"about.md"`) straight through, this is
 * the default behaviour, and most of what we're doing is retrieving the document, parsing it and returning
 * it, allowing each field to essentially do nothing.
 *
 */
const schemaResolver = async (
  source: FieldResolverSource,
  args: FieldResolverArgs,
  context: ContextT,
  info: GraphQLResolveInfo,
  sectionMap: {
    [key: string]: {
      section: DirectorySection;
      mutation?: boolean;
      plural: boolean;
    };
  }
) => {
  const value = source[info.fieldName];

  switch (info.fieldName) {
    case "node":
      return resolveNode(args, context);
    case "documents":
      return resolveDocuments(value, args, context);
    case "breadcrumbs":
      return resolveBreadcrumbs(value, args, context);
    case "getSection":
      return resolveSection(args, context);
    case "getSections":
      return resolveSections(context);
    case "addPendingDocument":
      await addPendingDocument(args, context);
      return resolveDocument({ args, context });
    default:
      break;
  }

  const sectionItem = sectionMap[info.fieldName];
  if (sectionItem) {
    if (sectionItem.plural) {
      const documents = await context.datasource.getDocumentsForSection(
        sectionItem.section.slug
      );
      return sequential(documents, async (documentPath) =>
        resolveDocument({
          args: { fullPath: documentPath, section: sectionItem.section.slug },
          context: context,
        })
      );
    } else if (sectionItem.mutation) {
      await resolver.input({
        args: {
          ...args,
          section: sectionItem.section.slug,
        },
        params: args.params,
        datasource: context.datasource,
      });
      return resolveDocument({ args, context });
    } else {
      return resolveDocument({
        args: {
          relativePath: args.relativePath,
          section: sectionItem.section.slug,
        },
        context,
      });
    }
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
  // FIXME: this check runs event when we have a scalar value, it's probably easier to flip this if/else
  if (isReferenceField(value)) {
    switch (value._resolver_kind) {
      case "_nested_source":
        const documentArgs = {
          args: value._args,
          context,
        };
        return resolveDocument(documentArgs);

      case "_nested_sources":
        return sequential(value._args.fullPaths, async (p) => {
          return resolveDocument({
            args: { fullPath: p, section: value._args.section, ...args },
            context,
          });
        });
    }
  } else {
    // No processing needed, just pass the value straight through
    return value;
  }
};

export const resolver = {
  data: async ({ datasource, template, data, content }: any) => {
    const accum: { [key: string]: unknown } = {};
    const { template: _templateName, ...rest } = data;
    await sequential(Object.keys(rest), async (key) => {
      const field = findField([...template.fields, textarea.contentField], key);
      return (accum[key] = await dataValue(datasource, field, rest[key]));
    });

    return {
      __typename: templateTypeName(
        template,
        "Data",
        typeof content !== "undefined" // FIXME: be more explicit
      ),
      _body: content,
      ...accum,
    };
  },
  values: async ({ datasource, template, data, content }: any) => {
    const accum: { [key: string]: unknown } = {};

    const { template: _templateName, ...rest } = data;

    await sequential(Object.keys(rest), async (key) => {
      const field = findField([...template.fields, textarea.contentField], key);
      return (accum[key] = await dataInitialValuesField(
        datasource,
        field,
        data[key]
      ));
    });
    accum["_body"] = content;

    return {
      __typename: templateTypeName(
        template,
        "Values",
        typeof content !== "undefined" // FIXME: be more explicit
      ),
      _template: template.name,
      ...accum,
    };
  },
  form: async ({
    datasource,
    template,
    includeBody,
  }: {
    datasource: DataSource;
    template: TemplateData;
    includeBody?: boolean;
  }) => {
    const fields = await sequential(template.fields, async (field) =>
      dataField(datasource, field)
    );

    if (includeBody) {
      fields.push(
        await textarea.resolve.field({
          datasource,
          field: textarea.contentField,
        })
      );
    }

    return {
      ...template,
      __typename: templateTypeName(template, "Form", !!includeBody),
      fields,
    };
  },
  // FIXME
  input: async (args: any) => {
    return args;
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
      return fieldGroupList.resolve.initialValue({ datasource, field, value });
    case "boolean":
      return boolean.resolve.initialValue({ datasource, field, value });
    case "datetime":
      return datetime.resolve.initialValue({ datasource, field, value });
    case "file":
      return file.resolve.initialValue({ datasource, field, value });
    case "image_gallery":
      return imageGallery.resolve.initialValue({ datasource, field, value });
    case "number":
      return number.resolve.initialValue({ datasource, field, value });
    case "tag_list":
      return tag_list.resolve.initialValue({ datasource, field, value });
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
      return boolean.resolve.value({ datasource, field, value });
    case "datetime":
      return datetime.resolve.value({ datasource, field, value });
    case "file":
      return file.resolve.value({ datasource, field, value });
    case "image_gallery":
      return imageGallery.resolve.value({ datasource, field, value });
    case "number":
      return number.resolve.value({ datasource, field, value });
    case "tag_list":
      return tag_list.resolve.value({ datasource, field, value });
  }
};
const dataField = async (datasource: DataSource, field: Field) => {
  switch (field.type) {
    case "text":
      return text.resolve.field({ datasource, field });
    case "textarea":
      return textarea.resolve.field({ datasource, field });
    case "blocks":
      return blocks.resolve.field({ datasource, field });
    case "select":
      return select.resolve.field({ datasource, field });
    case "list":
      return list.resolve.field({ datasource, field });
    case "field_group":
      return fieldGroup.resolve.field({ datasource, field });
    case "field_group_list":
      return fieldGroupList.resolve.field({
        datasource,
        field,
      });
    case "boolean":
      return boolean.resolve.field({ datasource, field });
    case "datetime":
      return datetime.resolve.field({ datasource, field });
    case "file":
      return file.resolve.field({ datasource, field });
    case "image_gallery":
      return imageGallery.resolve.field({ datasource, field });
    case "number":
      return number.resolve.field({ datasource, field });
    case "tag_list":
      return tag_list.resolve.field({ datasource, field });
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
      return text.resolve.input({ datasource, field, value });
    case "textarea":
      return textarea.resolve.input({ datasource, field, value });
    case "blocks":
      return blocks.resolve.input({ datasource, field, value });
    case "select":
      return select.resolve.input({ datasource, field, value });
    case "list":
      return list.resolve.input({ datasource, field, value });
    case "field_group":
      return fieldGroup.resolve.input({ datasource, field, value });
    case "field_group_list":
      return fieldGroupList.resolve.input({ datasource, field, value });
    case "boolean":
      return boolean.resolve.input({ datasource, field, value });
    case "datetime":
      return datetime.resolve.input({ datasource, field, value });
    case "file":
      return file.resolve.input({ datasource, field, value });
    case "image_gallery":
      return imageGallery.resolve.input({ datasource, field, value });
    case "number":
      return number.resolve.input({ datasource, field, value });
    case "tag_list":
      return tag_list.resolve.input({ datasource, field, value });
  }
};

/**
 *
 * Most of the starts here, field-level form, data and value resolvers initiate here.
 *
 */
const resolveDocument = async ({
  args,
  context,
}: {
  args: FieldResolverArgs;
  context: ContextT;
}) => {
  const { datasource } = context;

  assertShape<{
    relativePath?: string;
    fullPath?: string;
    section: string;
  }>(args, (yup) =>
    yup.object({
      relativePath: yup.string(),
      fullPath: yup.string(),
      section: yup.string().required(),
    })
  );

  const sectionData = await datasource.getSettingsForSection(args.section);

  // FIXME: we're supporting both full path and relative path args, when we use this from the hook we only have
  // access to the documents full id, not the relative path, this should support both kinds of calls, but
  // probably needs a better argument option as relativePath is misleading
  const relativePath = args.fullPath
    ? args.fullPath
        .replace(sectionData.path, "")
        .replace(/^[^a-z\d]*|[^a-z\d]*$/gi, "")
    : args.relativePath?.startsWith(sectionData.path)
    ? args.relativePath.replace(sectionData.path, "")
    : args.relativePath;

  if (!relativePath) {
    throw new Error(`Expected either relativePath or fullPath arguments`);
  }

  const realArgs = { relativePath, section: args.section };
  const { data, content } = await datasource.getData(realArgs);
  const template = await datasource.getTemplateForDocument(realArgs);
  const { basename, filename, extension } = await datasource.getDocumentMeta(
    realArgs
  );

  return {
    __typename: friendlyName(sectionData.slug, "Document"),
    id: path.join(sectionData.path, realArgs.relativePath),
    sys: {
      path: path.join(sectionData.path, realArgs.relativePath),
      relativePath,
      section: sectionData,
      breadcrumbs: relativePath.split("/").filter(Boolean),
      basename,
      filename,
      extension,
    },
    form: await resolver.form({ datasource, template, includeBody: true }),
    data: await resolver.data({
      datasource,
      template: template,
      data,
      content,
    }),
    values: await resolver.values({
      datasource,
      template,
      data,
      content: content || "",
    }),
  };
};

const resolveNode = async (args: FieldResolverArgs, context: ContextT) => {
  if (typeof args.id !== "string") {
    throw new Error("Expected argument ID for node query");
  }
  const section = await context.datasource.getSectionByPath(args.id);
  return await resolveDocument({
    args: { fullPath: args.id, section: section.slug },
    context,
  });
};

const resolveDocuments = async (
  value: unknown,
  args: FieldResolverArgs,
  context: ContextT
) => {
  assertShape<{ _section: string }>(value, (yup) =>
    yup.object({ _section: yup.string().required() })
  );
  assertShape<{ section: string }>(args, (yup) =>
    yup.object({ section: yup.string() })
  );

  let sections = await context.datasource.getSectionsSettings();

  if (args.section) {
    sections = sections.filter((section) => section.slug === args.section);
  }
  if (value && value._section) {
    sections = sections.filter((section) => section.slug === value._section);
  }

  const sectionDocs = _.flatten(
    await sequential(sections, async (s) => {
      const paths = await context.datasource.getDocumentsForSection(s.slug);
      return await sequential(paths, async (documentPath) => {
        const document = await resolveDocument({
          args: { fullPath: documentPath, section: s.slug },
          context,
        });

        return document;
      });
    })
  );
  return sectionDocs;
};

const resolveBreadcrumbs = async (
  value: unknown,
  args: FieldResolverArgs,
  context: ContextT
) => {
  if (args.excludeExtension) {
    if (!Array.isArray(value)) {
      throw new Error(`Expected breadcrumb value to be an array`);
    }
    return value.map((item, i) => {
      if (i === value.length - 1) {
        return item.replace(path.extname(item), "");
      }
      return item;
    });
  } else {
    return value;
  }
};

const resolveSection = async (args: FieldResolverArgs, context: ContextT) => {
  assertShape<{ section: string }>(args, (yup) =>
    yup.object({ section: yup.string().required() })
  );

  let section = await context.datasource.getSettingsForSection(args.section);
  return {
    ...section,
    documents: {
      _section: section.slug,
    },
  };
};

const resolveSections = async (context: ContextT) => {
  let sections = await context.datasource.getSectionsSettings();
  return sequential(sections, async (section) => {
    return resolveSection({ section: section.slug }, context);
  });
};

const addPendingDocument = async (
  args: FieldResolverArgs,
  context: ContextT
) => {
  assertShape<{ relativePath: string; section: string; template: string }>(
    args,
    (yup) =>
      yup.object({
        relativePath: yup.string(),
        section: yup.string(),
        template: yup.string(),
      })
  );
  await context.datasource.addDocument(args);

  return true;
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

/**
 * Each document request should populate these reserved
 * properties so we know how to delegate them, for fields
 * list "select" fields which reference another document
 * it is responsible for providing these in the field
 * value resolver
 */
function isReferenceField(
  item: unknown | FieldResolverSource
): item is ReferenceSource {
  try {
    assertShape<{ _resolver: string }>(item, (yup) =>
      yup.object({ _resolver: yup.string().required() })
    );
    return true;
  } catch (e) {
    return false;
  }
}

export type ContextT = {
  datasource: DataSource;
};
type FieldResolverArgs = { [argName: string]: unknown };

/**
 * When the source doesn't contain the value, but instead
 * containst information about how to go and get the value.
 *
 * This used for references, instead of over-fetching, we return
 * these values which act as args for the next resolve function
 * call to use
 */
export type ReferenceSource =
  | { _resolver_kind: null }
  | {
      _resolver: "_resource";
      _resolver_kind: "_nested_source";
      _args: { fullPath: string; section: string };
    }
  | {
      _resolver: "_resource";
      _resolver_kind: "_nested_sources";
      _args: { fullPaths: string[]; section: string };
    };

type FieldResolverSource = {
  [key: string]: ReferenceSource | unknown;
};
