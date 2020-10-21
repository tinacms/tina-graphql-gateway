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
import { friendlyName } from "@forestryio/graphql-helpers";
import { sequential } from "../util";

import type {
  DocumentNode,
  UnionTypeDefinitionNode,
  ObjectTypeDefinitionNode,
  EnumTypeDefinitionNode,
  InputObjectTypeDefinitionNode,
  FieldDefinitionNode,
  InputValueDefinitionNode,
} from "graphql";
import type { TemplateData } from "../types";
import type { Field } from "../fields";

export type Definitions =
  | ObjectTypeDefinitionNode
  | UnionTypeDefinitionNode
  | InputObjectTypeDefinitionNode
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
  documentDataInputObject: (
    cache: Cache,
    template: TemplateData,
    returnTemplate: boolean,
    accumulator: Definitions[],
    build?: boolean
  ) => Promise<string>;
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
    accumulator: Definitions[]
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
  }) => Promise<DocumentNode>;
}

/**
 * @internal this is redundant in documentation
 */
export const builder: Builder = {
  documentDataInputObject: async (
    cache,
    template,
    returnTemplate,
    accumulator,
    build = true
  ) => {
    const name = friendlyName(template, "InputData");

    if (build) {
      const fieldNames = await sequential(template.fields, async (field) => {
        // TODO: this is where non-null criteria can be set
        return await buildTemplateInputDataField(cache, field, accumulator);
      });

      if (returnTemplate) {
        fieldNames.unshift(gql.inputString("template"));
      }

      if (build) {
        accumulator.push(gql.input({ name, fields: fieldNames }));
      }
    }

    return name;
  },
  documentDataObject: async ({
    cache,
    template,
    returnTemplate,
    accumulator,
    includeContent = false,
  }) => {
    const name = friendlyName(template, "Data");
    const fields = await sequential(template.fields, async (field) => {
      return await buildTemplateDataField(cache, field, accumulator);
    });

    if (includeContent) {
      // fields.push(
      //   textarea.build.value({
      //     cache,
      //     field: textarea.contentField,
      //     accumulator,
      //   })
      // );
    }

    accumulator.push(gql.object({ name, fields }));

    return name;
  },
  documentDataUnion: async ({
    cache,
    templates,
    returnTemplate,
    accumulator,
  }) => {
    const name = friendlyName(templates, "DataUnion");
    const templateObjects = await cache.datasource.getTemplates(templates);
    const types = await sequential(
      templateObjects,
      async (template) =>
        await builder.documentDataObject({
          cache,
          template,
          returnTemplate,
          accumulator,
        })
    );

    accumulator.push(gql.union({ name, types }));

    return name;
  },
  documentFormFieldsUnion: async (
    cache,
    template,
    accumulator,
    includeContent = false
  ): Promise<string> => {
    const name = friendlyName(template, "FormFields");
    const fieldNames = await buildTemplateFormFields(
      cache,
      template.fields,
      accumulator
    );

    if (includeContent) {
      // if (!fieldNames.includes("TextareaField")) {
      //   fieldNames.push(
      //     await textarea.build.field({
      //       cache,
      //       field: textarea.contentField,
      //       accumulator,
      //     })
      //   );
      // }
    }

    accumulator.push(gql.union({ name, types: _.uniq(fieldNames) }));

    return name;
  },
  documentFormObject: async (cache, template, accumulator) => {
    const name = friendlyName(template, "Form");

    const fieldUnionName = await builder.documentFormFieldsUnion(
      cache,
      template,
      accumulator
    );

    accumulator.push(
      gql.object({
        name,
        fields: [
          gql.field({ name: "label", type: "String" }),
          gql.field({ name: "name", type: "String" }),
          gql.fieldList({ name: "fields", type: fieldUnionName }),
        ],
      })
    );

    return name;
  },
  documentInitialValuesObject: async (
    cache,
    template,
    returnTemplate,
    accumulator,
    includeContent = false
  ) => {
    const name = friendlyName(template, "InitialValues");

    const fieldNames = await sequential(template.fields, async (field) => {
      return await buildTemplateInitialValueField(cache, field, accumulator);
    });

    if (returnTemplate) {
      fieldNames.unshift(gql.string("_template"));
    }

    if (includeContent) {
      // fieldNames.push(
      //   await textarea.build.initialValue({
      //     accumulator,
      //     field: textarea.contentField,
      //     cache,
      //   })
      // );
    }

    accumulator.push(gql.object({ name, fields: fieldNames }));

    return name;
  },
  documentInputObject: async (cache, template, accumulator) => {
    const name = friendlyName(template, "Input");

    const dataInputName = await builder.documentDataInputObject(
      cache,
      template,
      false,
      accumulator
    );

    accumulator.push(
      gql.input({
        name,
        fields: [
          gql.inputValue("data", dataInputName),
          gql.inputValue("content", "String"),
        ],
      })
    );

    return name;
  },
  documentObject: async (cache, template, accumulator, build) => {
    const name = friendlyName(template);
    if (build) {
      const formName = await builder.documentFormObject(
        cache,
        template,
        accumulator
      );
      const dataName = await builder.documentDataObject({
        cache,
        template,
        returnTemplate: false,
        accumulator,
        includeContent: true,
      });
      const initialValuesName = await builder.documentInitialValuesObject(
        cache,
        template,
        false,
        accumulator
      );

      accumulator.push(
        gql.object({
          name,
          fields: [
            gql.field({ name: "path", type: "String" }),
            gql.field({ name: "relativePath", type: "String" }),
            gql.fieldList({ name: "breadcrumbs", type: "String" }),
            gql.field({ name: "basename", type: "String" }),
            gql.field({ name: "extension", type: "String" }),
            gql.field({ name: "filename", type: "String" }),
            gql.field({ name: "form", type: formName }),
            gql.field({ name: "data", type: dataName }),
            gql.field({ name: "initialValues", type: initialValuesName }),
          ],
        })
      );
    }

    return name;
  },
  documentTaggedUnionInputObject: async ({ cache, section, accumulator }) => {
    const name = friendlyName(section, "DocumentInput");

    const templates = await sequential(
      await cache.datasource.getTemplatesForSection(section),
      async (template) => {
        return await builder.documentInputObject(cache, template, accumulator);
      }
    );

    accumulator.push(
      gql.input({
        name,
        fields: templates.map((templateName) =>
          gql.inputValue(templateName, templateName)
        ),
      })
    );
    return name;
  },
  documentDataTaggedUnionInputObject: async ({
    cache,
    templateSlugs,
    accumulator,
  }) => {
    const name = friendlyName(templateSlugs.join("_"), "DocumentInput");

    const templateData = await sequential(
      templateSlugs,
      async (templateSlug) => await cache.datasource.getTemplate(templateSlug)
    );
    const templates = await sequential(templateData, async (template) => {
      return await builder.documentDataInputObject(
        cache,
        template,
        true,
        accumulator,
        true
      );
    });

    accumulator.push(
      gql.input({
        name,
        fields: templates.map((templateName) =>
          gql.inputValue(templateName, templateName)
        ),
      })
    );
    return name;
  },
  documentUnion: async ({ cache, section, accumulator, build = true }) => {
    const name = friendlyName(section, "DocumentUnion");

    const templates = await cache.datasource.getTemplatesForSection(section);
    const templateNames = await sequential(
      templates,
      async (template: TemplateData) => {
        return await builder.documentObject(
          cache,
          template,
          accumulator,
          build
        );
      }
    );
    accumulator.push(gql.union({ name: name, types: templateNames }));

    return name;
  },
  initialValuesUnion: async ({
    cache,
    templates,
    returnTemplate,
    accumulator,
  }) => {
    const name = friendlyName(templates, "InitialValuesUnion");
    const templateObjects = await cache.datasource.getTemplates(templates);
    const types = await sequential(
      templateObjects,
      async (template) =>
        await builder.documentInitialValuesObject(
          cache,
          template,
          returnTemplate,
          accumulator
        )
    );
    accumulator.push(gql.union({ name, types }));

    return name;
  },
  schema: async ({ cache }: { cache: Cache }) => {
    const accumulator: Definitions[] = [
      gql.object({
        name: "Query",
        fields: [
          gql.field({
            name: "document",
            type: "DocumentUnion",
            args: [gql.inputString("path")],
          }),
          gql.field({
            name: "documentForSection",
            type: "DocumentUnion",
            args: [gql.inputString("relativePath"), gql.inputString("section")],
          }),
          gql.fieldList({
            name: "documentList",
            type: "String",
            args: [gql.inputString("directory")],
          }),
          gql.fieldList({
            name: "documentListBySection",
            type: "DocumentUnion",
            args: [gql.inputString("section")],
          }),
          gql.field({
            name: "media",
            type: "String",
            args: [gql.inputString("path")],
          }),
          gql.fieldList({
            name: "mediaList",
            type: "String",
            args: [gql.inputString("directory")],
          }),
        ],
      }),
      gql.object({
        name: "Mutation",
        fields: [
          gql.field({
            name: "updateDocument",
            type: "DocumentUnion",
            args: [
              gql.inputString("path"),
              gql.inputValue("params", "DocumentInput"),
            ],
          }),
        ],
      }),
    ];

    await builder.documentTaggedUnionInputObject({
      cache,
      accumulator,
    });
    await builder.documentUnion({ cache, accumulator });

    const schema: DocumentNode = {
      kind: "Document",
      // TODO: we can probably optimize this by not running calculations for fields
      // whose names we already have, not worth it for the first pass though.
      definitions: _.uniqBy(accumulator, (field) => field.name.value),
    };

    return schema;
  },
};

const buildTemplateFormFields = async (
  cache: Cache,
  fields: Field[],
  accumulator: Definitions[]
): Promise<string[]> => {
  return await sequential(fields, async (field) => {
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
    }
  });
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
      return select.build.initialValue({ cache, field, accumulator });
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
      return select.build.value({ cache, field, accumulator });
    case "blocks":
      return blocks.build.value({ cache, field, accumulator });
    case "field_group":
      return fieldGroup.build.value({ cache, field, accumulator });
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
  }
};
