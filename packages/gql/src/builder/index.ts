import _ from "lodash";
import { gql } from "../gql";

import { Cache } from "../cache";
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
import { templateTypeName, friendlyName } from "@forestryio/graphql-helpers";
import { sequential } from "../util";

import type {
  DocumentNode,
  UnionTypeDefinitionNode,
  ObjectTypeDefinitionNode,
  EnumTypeDefinitionNode,
  InputObjectTypeDefinitionNode,
  FieldDefinitionNode,
  InputValueDefinitionNode,
  ScalarTypeDefinitionNode,
  InterfaceTypeDefinitionNode,
} from "graphql";
import type { TemplateData, DirectorySection, Section } from "../types";
import type { Field } from "../fields";

export type Definitions =
  | ObjectTypeDefinitionNode
  | UnionTypeDefinitionNode
  | InputObjectTypeDefinitionNode
  | ScalarTypeDefinitionNode
  | InterfaceTypeDefinitionNode
  | EnumTypeDefinitionNode;

/**
 * The builder holds all the functions which are required to build the schema, everything
 * starts with the documentUnion, which then trickles down through the schema, populating
 * all the fields by reading the settings.yml and template definition files.
 */
export interface Builder {
  /**
   * Builds the input type for document data
   *
   * ```graphql
   * # example
   * input PostInputData {
   *   _template: String
   *   title: String
   *   author: String
   * }
   * ```
   *
   * See {@link Resolver.documentDataInputObject} for the equivalent resolver
   */
  documentDataInputObject: ({
    cache,
    template,
    returnTemplate,
    accumulator,
    build,
  }: {
    cache: Cache;
    template: TemplateData;
    returnTemplate: boolean;
    accumulator: Definitions[];
    build?: boolean;
  }) => Promise<string>;
  /**
   * Similar to documentObject except it only deals with unions on the data layer
   *
   * Builds out the type of data based on the provided template.
   * Each `type` from the {@link documentDataUnion} is built by this function.
   *
   * ```graphql
   * # example
   * type PostData {
   *   title: String
   *   author: AuthorDocument
   * }
   * ```
   *
   * See {@link Resolver.documentDataObject} for the equivalent resolver
   */
  documentDataObject: (args: {
    cache: Cache;
    template: TemplateData;
    returnTemplate: boolean;
    accumulator: Definitions[];
    includeContent?: boolean;
  }) => Promise<string>;
  /**
   * Similar to {@link documentUnion} except it only deals with unions on the data layer.
   *
   * This is used in blocks, which stores it's values inline rather than via another document
   *
   * ```graphql
   * union blockDataUnion = HeroData | FeaturedPostData
   * ```
   *
   * Note that there is no equivalent `Resolver` for unions, this is because instead of providing a `typeResolver`, we
   * return the `__typename` from each possible type (which GraphQL uses if no `typeResolver` function is provided)
   */
  documentDataUnion: (args: {
    cache: Cache;
    templates: string[];
    returnTemplate: boolean;
    accumulator: Definitions[];
  }) => Promise<string>;
  /**
   * A form's fields is a union of different field types
   *
   * ```graphql
   * # example:
   * union PostFormFields = TextareaField | SelectField
   * # this actually returns a list of this union, meaning we have an array of unlike objects
   * [PostFormFields]
   * ```
   *
   * Note that there is no equivalent `Resolver` for unions, this is because instead of providing a `typeResolver`, we
   * return the `__typename` from each possible type (which GraphQL uses if no `typeResolver` function is provided)
   */
  documentFormFieldsUnion: (
    cache: Cache,
    template: TemplateData,
    accumulator: Definitions[],
    includeContent?: boolean
  ) => Promise<string>;
  /**
   * The top-level form type for a document
   *
   * ```graphql
   * # example
   * type AuthorForm = {
   *  _template: String,
   *  label: String,
   *  fields: [AuthorFormFields]
   * }
   * ```
   * See {@link Resolver.documentFormObject} for the equivalent resolver
   */
  documentFormObject: (
    cache: Cache,
    template: TemplateData,
    accumulator: Definitions[],
    includeContent?: boolean
  ) => Promise<string>;
  /**
   * The [initial values](https://tinacms.org/docs/plugins/forms/#form-configuration) for the Tina form.
   *
   * `_template` is provided as a disambiguator when the result value is inside an array.
   *
   * ```graphql
   * type PostInitialValues {
   *   _template: String
   *   title: String
   *   author: String
   *   categories: [CategoryData]
   * }
   * ```
   *
   * See {@link Resolver.documentInitialValuesObject} for the equivalent resolver
   */
  documentInitialValuesObject: (
    cache: Cache,
    template: TemplateData,
    returnTemplate: boolean,
    accumulator: Definitions[],
    includeContent?: boolean
  ) => Promise<string>;
  /**
   * The input values for the document. See {@link documentDataInputObject} for the data input portion.
   * ```graphql
   * # example
   * input PostInput {
   *   content: String
   *   data: PostInputData
   * }
   * ```
   *
   * See {@link Resolver.documentInputObject} for the equivalent resolver
   */
  documentInputObject: (
    cache: Cache,
    template: TemplateData,
    accumulator: Definitions[]
  ) => Promise<string>;
  /**
   * Builds out the type of document based on the provided template.
   * Each `type` from the {@link documentUnion} is built by this function.
   *
   * ```graphql
   * type Post {
   *  path: String
   *  form: PostForm
   *  data: PostData
   *  initialValues: PostInitialValues
   * }
   * ```
   *
   * See {@link Resolver.documentObject} for the equivalent resolver
   */
  documentObject: (
    cache: Cache,
    template: TemplateData,
    accumulator: Definitions[],
    build: boolean
  ) => Promise<string>;
  /**
   * The input values for mutations to the document from a section
   *
   * ```graphql
   * # Example
   * input DocumentInput {
   *  PostInput: PostInput
   *  AuthorInput: AuthorInput
   * }
   * ```
   *
   * Note that while this isn't a union, it's behaving close to one,
   * GraphQL doesn't support unions in mutations, so instead each key
   * (ex. `PostInput`) is the property we require when accepting a mutation.
   *
   * So if your payload looked like this it'd be considered invalid, while it's
   * possible to provide both `PostInput` and `AuthorInput` from the schema's perspective
   * , we'll throw an error, changing the author data at path `posts/1.md` makes no sense:
   *
   * ```json
   * {
   *  "path": "posts/1.md",
   *  "params": {
   *    "PostInput": {
   *      "data": {
   *        ...
   *    "AuthorInput": {
   *      "data": {
   *        ...
   * ```

   * [Read more about the trade-offs here](https://github.com/graphql/graphql-spec/blob/master/rfcs/InputUnion.md#-5-one-of-tagged-union)

   */
  documentTaggedUnionInputObject: (args: {
    cache: Cache;
    section?: string;
    accumulator: Definitions[];
  }) => Promise<string>;
  /**
   *
   */
  documentDataTaggedUnionInputObject: (args: {
    cache: Cache;
    templateSlugs: string[];
    accumulator: Definitions[];
  }) => Promise<string>;
  /**
   * The top-level result, a document is a file which may be of any one of the templates
   * defined, the union consists of each template which is possible.
   *
   * ```graphql
   * union DocumentUnion = Post | Page
   * ```
   *
   * Note that this is also used on section-level references as well. If you have a `post` template
   * which has an `authors` reference, that author document could consist of multiple template types.
   * An example might be that some authors use a more detailed template, while others are very basic
   *
   * ```graphql
   * union authorsDocumentUnion = DetailedAuthor | BasicAuthor
   * ```
   * In this example the `authorsDocumentUnion` would be referenced in the `Post`'s type (notice that the
   * `authorsDocumentUnion` is "namespaced" by the section slug `authors`)
   * ```graphql
   * type PostData {
   *   title: String
   *   author: AuthorDocument
   * }
   *
   * type AuthorDocument {
   *   document: authorsDocumentUnion
   * }
   *
   * union authorsDocumentUnion = DetailedAuthor | BasicAuthor
   * ```
   */
  documentUnion: (args: {
    cache: Cache;
    section?: string;
    accumulator: Definitions[];
    build?: boolean;
  }) => Promise<string>;
  documentNodeUnion: (args: {
    cache: Cache;
    section?: string;
    accumulator: Definitions[];
    build?: boolean;
  }) => Promise<string>;
  documentUnionInner: (args: {
    cache: Cache;
    section?: string;
    accumulator: Definitions[];
    build?: boolean;
  }) => Promise<string>;
  /**
   * Currently only used by blocks, which accepts an array of values with different shapes,
   * disambiguated by their `_template` property seen in {@link documentInitialValuesObject}.
   *
   * ```graphql
   * union sectionInitialValuesUnion = HeroInitialValues | FeaturedPostInitialValues
   *
   * type HeroInitialValues {
   *   _template: String
   *   description: String
   *   image: String
   * }
   *
   * type FeaturedPostInitialValues {
   *   _template: String
   *   cta: String
   *   post: Post
   * }
   * ```
   */
  initialValuesUnion: (args: {
    cache: Cache;
    templates: string[];
    returnTemplate: boolean;
    accumulator: Definitions[];
  }) => Promise<string>;
  /**
   * The entrypoint to the build process. It's likely we'll have many more query fields
   * in the future.
   *
   *  ```graphql
   * # example
   *  type Query {
   *    document(path: String): DocumentUnion
   *  }
   *
   *  union DocumentUnion = Post | Author
   *
   *  type Mutation {
   *    updateDocument(path: String!, params: DocumentInput): DocumentUnion
   *  }
   *
   *  input DocumentInput {
   *    PostInput: PostInput
   *    AuthorInput: AuthorInput
   *  }
   *
   *  ...
   *  ```
   */
  schema: (args: {
    cache: Cache;
    /** If no section is provided, this is the top-level document field */
    section?: string;
  }) => Promise<{
    schema: DocumentNode;
    sectionMap: {
      [key: string]: {
        section: DirectorySection;
      };
    };
  }>;
  sectionUnion: (args: {
    cache: Cache;
    section?: string;
    accumulator: Definitions[];
    build?: boolean;
  }) => Promise<string>;
}

/**
 * @internal this is redundant in documentation
 */
export const builder = {
  schema: async ({ cache }: { cache: Cache }) => {
    const sectionMap: {
      [key: string]: {
        section: DirectorySection;
        plural: boolean;
        mutation?: boolean;
        queryName: string;
        returnType: string;
      };
    } = {};
    const sections = await cache.datasource.getSectionsSettings();
    const templates = await cache.datasource.getAllTemplates();

    const mutationsArray: {
      section: Section;
      mutationName: string;
      returnType: string;
    }[] = [];

    sections.forEach((section) => {
      mutationsArray.push({
        section,
        mutationName: `update${friendlyName(section.slug)}Document`,
        returnType: friendlyName(section.slug, "Document"),
      });
      sectionMap[`update${friendlyName(section.slug)}Document`] = {
        section,
        plural: false,
        mutation: true,
        queryName: `update${friendlyName(section.slug)}Document`,
        returnType: friendlyName(section.slug, "Document"),
      };
      sectionMap[`get${friendlyName(section.slug)}Document`] = {
        section,
        plural: false,
        queryName: `get${friendlyName(section.slug)}Document`,
        returnType: friendlyName(section.slug, "Document"),
      };
      sectionMap[`get${friendlyName(section.slug)}List`] = {
        section,
        plural: true,
        queryName: `get${friendlyName(section.slug)}List`,
        returnType: friendlyName(section.slug, "Document"),
      };
    });

    const accumulator: Definitions[] = [
      gql.interface({ name: "Node", fields: [gql.fieldID({ name: "id" })] }),
      gql.interface({
        name: "Document",
        fields: [
          gql.field({ name: "sys", type: "SystemInfo" }),
          gql.fieldID({ name: "id" }),
        ],
      }),
      gql.interface({
        name: "FormField",
        fields: [
          gql.field({ name: "label", type: "String" }),
          gql.field({ name: "name", type: "String" }),
          gql.field({ name: "component", type: "String" }),
        ],
      }),
      gql.scalar("JSON"),
      gql.scalar("JSONObject"),
      gql.object({
        name: "SystemInfo",
        fields: [
          gql.field({ name: "filename", type: "String" }),
          gql.field({ name: "basename", type: "String" }),
          gql.fieldList({
            name: "breadcrumbs",
            type: "String",
            args: [gql.inputBoolean("excludeExtension")],
          }),
          gql.field({ name: "path", type: "String" }),
          gql.field({ name: "relativePath", type: "String" }),
          gql.field({ name: "extension", type: "String" }),
          gql.field({ name: "section", type: "Section" }),
        ],
      }),
      gql.object({
        name: "Section",
        fields: [
          gql.field({ name: "type", type: "String" }),
          gql.field({ name: "path", type: "String" }),
          gql.field({ name: "label", type: "String" }),
          gql.field({ name: "create", type: "String" }),
          gql.field({ name: "match", type: "String" }),
          gql.field({ name: "new_doc_ext", type: "String" }),
          gql.fieldList({ name: "templates", type: "String" }),
          gql.field({ name: "slug", type: "String" }),
          gql.fieldList({ name: "documents", type: "Document" }),
        ],
      }),
      gql.object({
        name: "Mutation",
        fields: [
          gql.field({
            name: "addPendingDocument",
            type: "Node",
            args: [
              gql.inputString("relativePath"),
              gql.inputString("section"),
              gql.inputString("template"),
            ],
          }),
          ...mutationsArray.map((mutation) => {
            return gql.field({
              name: mutation.mutationName,
              type: mutation.returnType,
              args: [
                gql.inputString("relativePath"),
                gql.inputValue(
                  "params",
                  friendlyName(mutation.section.slug, "Input")
                ),
              ],
            });
          }),
        ],
      }),
      gql.object({
        name: "Query",
        fields: [
          gql.field({
            name: "node",
            type: "Node",
            args: [gql.inputID("id")],
          }),
          gql.fieldList({
            name: "getSections",
            type: "Section",
          }),
          gql.field({
            name: "getSection",
            type: "Section",
            args: [gql.inputString("section")],
          }),
          ...Object.values(sectionMap).map((section) => {
            return section.plural
              ? gql.fieldList({
                  name: section.queryName,
                  type: section.returnType,
                  args: [],
                })
              : gql.field({
                  name: section.queryName,
                  type: section.returnType,
                  args: [gql.inputString("relativePath")],
                });
          }),
        ],
      }),
    ];

    const directorySections = await (
      await cache.datasource.getSectionsSettings()
    ).filter((section) => section.type === "directory");

    await sequential(directorySections, async (section) => {
      const name = friendlyName(section.slug);
      accumulator.push(
        gql.union({
          name: friendlyName(name, "Data"),
          types: section.templates.map((template) =>
            templateTypeName(template, "Data", true)
          ),
        })
      );
      accumulator.push(
        gql.input({
          name: friendlyName(name, "Input"),
          fields: section.templates.map((template) =>
            gql.inputValue(
              friendlyName(template, "", true),
              templateTypeName(template, "Input", true)
            )
          ),
        })
      );
      accumulator.push(
        gql.union({
          name: friendlyName(name, "Values"),
          types: section.templates.map((template) =>
            templateTypeName(template, "Values", true)
          ),
        })
      );
      accumulator.push(
        gql.union({
          name: friendlyName(name, "Form"),
          types: section.templates.map((template) =>
            templateTypeName(template, "Form", true)
          ),
        })
      );
      accumulator.push(
        gql.object({
          name: friendlyName(name, "Document"),
          interfaces: [
            {
              kind: "NamedType",
              name: {
                kind: "Name",
                value: "Node",
              },
            },
            {
              kind: "NamedType",
              name: {
                kind: "Name",
                value: "Document",
              },
            },
          ],
          fields: [
            gql.fieldID({ name: "id" }),
            gql.field({ name: "sys", type: "SystemInfo" }),
            gql.field({
              name: "data",
              type: friendlyName(name, "Data"),
            }),
            gql.field({
              name: "values",
              type: friendlyName(name, "Values"),
            }),
            gql.field({
              name: "form",
              type: friendlyName(name, "Form"),
            }),
          ],
        })
      );
    });

    await sequential(templates, async (template) => {
      /**
       * Initial build is for documents, meaning an implicit _body
       * field may be included
       */
      await buildTemplateOrField(cache, template, accumulator, true);
      /**
       * This build is for block-level values, which don't support
       * the implicit _body key
       */
      await buildTemplateOrField(cache, template, accumulator, false);
    });

    const schema: DocumentNode = {
      kind: "Document",
      definitions: _.uniqBy(accumulator, (field) => field.name.value),
    };

    return { schema, sectionMap };
  },
};

export const buildTemplateOrField = async (
  cache: Cache,
  template: TemplateData,
  accumulator: Definitions[],
  includeBody: boolean
) => {
  await buildTemplateOrFieldData(cache, template, accumulator, includeBody);
  await buildTemplateOrFieldValues(cache, template, accumulator, includeBody);
  await buildTemplateOrFieldForm(cache, template, accumulator, includeBody);
  await buildTemplateOrFieldInput(cache, template, accumulator, includeBody);
};
export const buildTemplateOrFieldData = async (
  cache: Cache,
  template: TemplateData,
  accumulator: Definitions[],
  includeBody: boolean
) => {
  const name = templateTypeName(template, "Data", includeBody);

  const fields = await sequential(template.fields, async (field) => {
    return await buildTemplateDataField(cache, field, accumulator);
  });

  if (includeBody) {
    fields.push(
      await buildTemplateDataField(cache, textarea.contentField, accumulator)
    );
  }

  accumulator.push(
    gql.object({
      name,
      fields,
    })
  );

  return name;
};
export const buildTemplateOrFieldValues = async (
  cache: Cache,
  template: TemplateData,
  accumulator: Definitions[],
  includeBody: boolean
) => {
  const name = templateTypeName(template, "Values", includeBody);

  const fields = await sequential(template.fields, async (field) => {
    return buildTemplateInitialValueField(cache, field, accumulator);
  });

  if (includeBody) {
    fields.push(
      await buildTemplateInitialValueField(
        cache,
        textarea.contentField,
        accumulator
      )
    );
  }

  accumulator.push(
    gql.object({
      name,
      fields: [gql.field({ name: "_template", type: "String" }), ...fields],
    })
  );
  return name;
};

export const buildTemplateOrFieldFormFields = async (
  cache: Cache,
  template: TemplateData,
  accumulator: Definitions[],
  includeBody: boolean
) => {
  const name = templateTypeName(template, "Form", includeBody);

  const fields = await sequential(
    template.fields,
    async (field) => await buildTemplateFormField(cache, field, accumulator)
  );

  if (includeBody) {
    fields.push(
      await buildTemplateFormField(cache, textarea.contentField, accumulator)
    );
  }

  const fieldsUnionName = `${name}FieldsUnion`;
  accumulator.push(
    gql.union({
      name: fieldsUnionName,
      types: _.uniq(
        fields.map((field) => {
          switch (field.type.kind) {
            case "NamedType":
              return field.type.name.value;
            case "ListType":
            case "NonNullType":
              throw new Error(
                `Unexpected ${field.type.kind} for field union field`
              );
          }
        })
      ),
    })
  );

  return fieldsUnionName;
};

export const buildTemplateOrFieldInput = async (
  cache: Cache,
  template: TemplateData,
  accumulator: Definitions[],
  includeBody: boolean
) => {
  const name = templateTypeName(template, "Input", includeBody);

  const fields = await sequential(
    template.fields,
    async (field) =>
      await buildTemplateInputDataField(cache, field, accumulator)
  );

  if (includeBody) {
    fields.push(
      await buildTemplateInputDataField(
        cache,
        textarea.contentField,
        accumulator
      )
    );
  }

  accumulator.push(
    gql.input({
      name,
      fields,
    })
  );
  // accumulator.push(
  //   gql.union({
  //     name: fieldsUnionName,
  //     types: _.uniq(
  //       fields.map((field) => {
  //         switch (field.type.kind) {
  //           case "NamedType":
  //             return field.type.name.value;
  //           case "ListType":
  //           case "NonNullType":
  //             throw new Error(
  //               `Unexpected ${field.type.kind} for field union field`
  //             );
  //         }
  //       })
  //     ),
  //   })
  // );

  return name;
};

export const buildTemplateOrFieldForm = async (
  cache: Cache,
  template: TemplateData,
  accumulator: Definitions[],
  includeBody: boolean
) => {
  const name = templateTypeName(template, "Form", includeBody);

  const fieldsUnionName = await buildTemplateOrFieldFormFields(
    cache,
    template,
    accumulator,
    includeBody
  );

  accumulator.push(
    gql.object({
      name,
      fields: [
        gql.field({ name: "label", type: `String` }),
        gql.field({ name: "name", type: `String` }),
        gql.fieldList({ name: "fields", type: fieldsUnionName }),
      ],
    })
  );

  return name;
};

const buildTemplateFormField = async (
  cache: Cache,
  field: Field,
  accumulator: Definitions[]
): Promise<FieldDefinitionNode> => {
  switch (field.type) {
    case "text":
      return text.build.field({ cache, field, accumulator });
    case "textarea":
      return textarea.build.field({ cache, field, accumulator });
    case "select":
      return select.build.field({ cache, field, accumulator });
    case "blocks":
      return blocks.build.field({ cache, field, accumulator });
    case "field_group_list":
      return fieldGroupList.build.field({ cache, field, accumulator });
    case "field_group":
      return fieldGroup.build.field({ cache, field, accumulator });
    case "list":
      return list.build.field({ cache, field, accumulator });
    case "boolean":
      return boolean.build.field({ cache, field, accumulator });
    case "datetime":
      return datetime.build.field({ cache, field, accumulator });
    case "file":
      return file.build.field({ cache, field, accumulator });
    case "image_gallery":
      return imageGallery.build.field({ cache, field, accumulator });
    case "number":
      return number.build.field({ cache, field, accumulator });
    case "tag_list":
      return tag_list.build.field({ cache, field, accumulator });
    default:
      return text.build.field({ cache, field, accumulator });
  }
};

const buildTemplateInitialValueField = async (
  cache: Cache,
  field: Field,
  accumulator: Definitions[]
): Promise<FieldDefinitionNode> => {
  switch (field.type) {
    case "text":
      return text.build.initialValue({ cache, field, accumulator });
    case "textarea":
      return textarea.build.initialValue({ cache, field, accumulator });
    case "select":
      return await select.build.initialValue({ cache, field, accumulator });
    case "blocks":
      return blocks.build.initialValue({ cache, field, accumulator });
    case "field_group":
      return fieldGroup.build.initialValue({ cache, field, accumulator });
    case "field_group_list":
      return fieldGroupList.build.initialValue({ cache, field, accumulator });
    case "list":
      return list.build.initialValue({ cache, field, accumulator });
    case "boolean":
      return boolean.build.initialValue({ cache, field, accumulator });
    case "datetime":
      return datetime.build.initialValue({ cache, field, accumulator });
    case "file":
      return file.build.initialValue({ cache, field, accumulator });
    case "image_gallery":
      return imageGallery.build.initialValue({ cache, field, accumulator });
    case "number":
      return number.build.initialValue({ cache, field, accumulator });
    case "tag_list":
      return tag_list.build.initialValue({ cache, field, accumulator });
    default:
      return text.build.initialValue({ cache, field, accumulator });
  }
};

const buildTemplateDataField = async (
  cache: Cache,
  field: Field,
  accumulator: Definitions[]
): Promise<FieldDefinitionNode> => {
  switch (field.type) {
    case "text":
      return text.build.value({ cache, field, accumulator });
    case "textarea":
      return textarea.build.value({ cache, field, accumulator });
    case "select":
      return await select.build.value({ cache, field, accumulator });
    case "blocks":
      return blocks.build.value({ cache, field, accumulator });
    case "field_group":
      return await fieldGroup.build.value({ cache, field, accumulator });
    case "field_group_list":
      return fieldGroupList.build.value({ cache, field, accumulator });
    case "list":
      return list.build.value({ cache, field, accumulator });
    case "boolean":
      return boolean.build.value({ cache, field, accumulator });
    case "datetime":
      return datetime.build.value({ cache, field, accumulator });
    case "file":
      return file.build.value({ cache, field, accumulator });
    case "image_gallery":
      return imageGallery.build.value({ cache, field, accumulator });
    case "number":
      return number.build.value({ cache, field, accumulator });
    case "tag_list":
      return tag_list.build.value({ cache, field, accumulator });
    default:
      return text.build.value({ cache, field, accumulator });
  }
};

const buildTemplateInputDataField = async (
  cache: Cache,
  field: Field,
  accumulator: Definitions[]
): Promise<InputValueDefinitionNode> => {
  switch (field.type) {
    case "text":
      return text.build.input({ cache, field, accumulator });
    case "textarea":
      return textarea.build.input({ cache, field, accumulator });
    case "select":
      return select.build.input({ cache, field, accumulator });
    case "blocks":
      return await blocks.build.input({ cache, field, accumulator });
    case "field_group":
      return fieldGroup.build.input({ cache, field, accumulator });
    case "field_group_list":
      return fieldGroupList.build.input({ cache, field, accumulator });
    case "list":
      return list.build.input({ cache, field, accumulator });
    case "boolean":
      return boolean.build.input({ cache, field, accumulator });
    case "datetime":
      return datetime.build.input({ cache, field, accumulator });
    case "file":
      return file.build.input({ cache, field, accumulator });
    case "image_gallery":
      return imageGallery.build.input({ cache, field, accumulator });
    case "number":
      return number.build.input({ cache, field, accumulator });
    case "tag_list":
      return tag_list.build.input({ cache, field, accumulator });
    default:
      return text.build.input({ cache, field, accumulator });
  }
};

export const builders = {
  buildTemplateOrFieldFormFields,
  buildTemplateOrFieldData,
  buildTemplateOrFieldValues,
  buildTemplateOrFieldInput,
};
