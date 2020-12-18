import _ from "lodash";
import { templateTypeName, friendlyName } from "@forestryio/graphql-helpers";
import { gql } from "../gql";
import { sequential } from "../util";

import { template } from "../fields/templates";

import type {
  DocumentNode,
  UnionTypeDefinitionNode,
  ObjectTypeDefinitionNode,
  EnumTypeDefinitionNode,
  InputObjectTypeDefinitionNode,
  ScalarTypeDefinitionNode,
  InterfaceTypeDefinitionNode,
} from "graphql";
import type { TemplateData, DirectorySection, Section } from "../types";
import type { Cache } from "../cache";

/**
 *
 * ### Schema Builder
 *
 * Build the schema for a given app, this is the main entrypoint into the
 * build process, it generates a schema based on the `.tina` configuration. The schema can be
 * printed and cached for use as well as a mapping object which adds some information to
 * query fields which will be passed through the resolver functions.
 *
 * For example, given a `Posts` section, it's possibe for the user to query
 * `getPostsDocument` - however when we receive that query it's not clear to us
 * that the resolver should only resolve documents for the `Posts` section, the
 * sectionMap helps with that:
 *
 * ```json
 *  {
 *    "getPostsDocument": {
 *      "section": {
 *        "slug": "posts"
 *        ...
 *      },
 *      "plural": false,
 *      "queryName": "getPostsDocument",
 *      "returnType": "Posts_Document"
 *    },
 *  }
 * ```
 */
export const schemaBuilder = async ({ cache }: { cache: Cache }) => {
  const sectionMap: sectionMap = {};
  const mutationsArray: mutationsArray = [];

  const sections = await cache.datasource.getSectionsSettings();

  sections.forEach((section) => {
    buildSectionMap(section, mutationsArray, sectionMap);
  });

  const accumulator: Definitions[] = [
    ...interfaceDefinitions,
    ...scalarDefinitions,
    systemInfoDefinition,
    sectionDefinition,
    mutationDefinition(mutationsArray),
    queryDefinition(sectionMap),
  ];

  await sequential(
    sections.filter((section) => section.type === "directory"),
    async (section) => {
      buildSectionDefinitions(section, accumulator);
      await sequential(section.templates, async (templateSlug) => {
        const args = {
          cache,
          template: await cache.datasource.getTemplate(templateSlug),
          accumulator,
          includeBody: true,
        };

        await template.build.data(args);
        await template.build.values(args);
        await template.build.form(args);
        await template.build.input(args);
      });
    }
  );

  const schema: DocumentNode = {
    kind: "Document",
    definitions: _.uniqBy(accumulator, (field) => field.name.value),
  };

  return { schema, sectionMap };
};

/**
 * Definitions for static interfaces which are identical
 * for any schema, ex. Node
 */
const interfaceDefinitions = [
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
];

/**
 * Definitions for additional scalars, ex. JSON
 */
const scalarDefinitions = [
  gql.scalar("Reference", "References another document, used as a foreign key"),
  gql.scalar("JSON"),
  gql.scalar("JSONObject"),
];

/**
 * System info provides information about a given document
 */
const systemInfoDefinition = gql.object({
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
});

const sectionDefinition = gql.object({
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
});

const buildSectionMap = (
  section: DirectorySection,
  mutationsArray: mutationsArray,
  sectionMap: sectionMap
) => {
  const returnType = friendlyName(section.slug, { suffix: "Document" });
  mutationsArray.push({
    section,
    mutationName: `update${friendlyName(section.slug)}Document`,
    returnType,
  });
  sectionMap[`update${friendlyName(section.slug)}Document`] = {
    section,
    plural: false,
    mutation: true,
    queryName: `update${friendlyName(section.slug)}Document`,
    returnType,
  };
  sectionMap[`get${friendlyName(section.slug)}Document`] = {
    section,
    plural: false,
    queryName: `get${friendlyName(section.slug)}Document`,
    returnType,
  };
  sectionMap[`get${friendlyName(section.slug)}List`] = {
    section,
    plural: true,
    queryName: `get${friendlyName(section.slug)}List`,
    returnType,
  };
};

/**
 * Given a list of mutation types, this will generate all possible
 * mutation definitions and argument definitions for a given schema. Ex. `Posts_Input`
 */
const mutationDefinition = (mutationsArray: mutationsArray) => {
  return gql.object({
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
              friendlyName(mutation.section.slug, { suffix: "Input" })
            ),
          ],
        });
      }),
    ],
  });
};

const queryDefinition = (sectionMap: sectionMap) => {
  return gql.object({
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
      ...Object.values(sectionMap)
        .filter((section) => !section.mutation)
        .map((section) => {
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
  });
};

const buildSectionDefinitions = (
  section: DirectorySection,
  accumulator: Definitions[]
) => {
  const name = friendlyName(section.slug);
  accumulator.push(
    gql.union({
      name: friendlyName(name, { suffix: "Data" }),
      types: section.templates.map((template) =>
        templateTypeName(template, "Data", true)
      ),
    })
  );
  accumulator.push(
    gql.input({
      name: friendlyName(name, { suffix: "Input" }),
      fields: section.templates.map((template) =>
        gql.inputValue(
          friendlyName(template, { lowerCase: true }),
          templateTypeName(template, "Input", true)
        )
      ),
    })
  );
  accumulator.push(
    gql.union({
      name: friendlyName(name, { suffix: "Values" }),
      types: section.templates.map((template) =>
        templateTypeName(template, "Values", true)
      ),
    })
  );
  accumulator.push(
    gql.union({
      name: friendlyName(name, { suffix: "Form" }),
      types: section.templates.map((template) =>
        templateTypeName(template, "Form", true)
      ),
    })
  );
  accumulator.push(
    gql.object({
      name: friendlyName(name, { suffix: "Document" }),
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
          type: friendlyName(name, { suffix: "Data" }),
        }),
        gql.field({
          name: "values",
          type: friendlyName(name, { suffix: "Values" }),
        }),
        gql.field({
          name: "form",
          type: friendlyName(name, { suffix: "Form" }),
        }),
      ],
    })
  );
};

export type Definitions =
  | ObjectTypeDefinitionNode
  | UnionTypeDefinitionNode
  | InputObjectTypeDefinitionNode
  | ScalarTypeDefinitionNode
  | InterfaceTypeDefinitionNode
  | EnumTypeDefinitionNode;

export type sectionMap = {
  [key: string]: {
    section: DirectorySection;
    plural: boolean;
    mutation?: boolean;
    queryName: string;
    returnType: string;
  };
};
type mutationsArray = {
  section: Section;
  mutationName: string;
  returnType: string;
}[];
