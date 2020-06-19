import { getData, getDirectoryList } from "./util";
import fs from "fs";
import path from "path";
import flatten from "lodash.flatten";
import express from "express";
import graphqlHTTP from "express-graphql";
import cors from "cors";
import { codegen } from "@graphql-codegen/core";
import { plugin as typescriptPlugin } from "@graphql-codegen/typescript";
import { plugin as typescriptOperationsPlugin } from "@graphql-codegen/typescript-operations";
import {
  parse,
  getNamedType,
  GraphQLError,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLUnionType,
  GraphQLNonNull,
  printSchema,
  GraphQLInputObjectType,
} from "graphql";
import { friendlyName, getFMTFilename } from "./formatFmt";
import { isDirectorySection, arrayToObject, isNotNull } from "./util";
import { Section, WithFields, Templates } from "./fieldTypes";
import { generateFields, buildGroupSetter } from "./fields/group";

type Settings = {
  data: { sections: Section[] };
};

type BaseDocumentType = {
  content: string;
  isEmpty: boolean;
  excerpt: string;
};

type DocumentType = BaseDocumentType & {
  path: string;
  template: string;
  data: object;
};

type FMT = BaseDocumentType & {
  data: WithFields & {
    label: string;
    hide_body: boolean;
    display_field: string;
    pages: string[];
  };
};

type TemplatesData = { [key: string]: GraphQLObjectType };

/**
 * This is the main function in this script, it returns all the types
 */
const buildSchema = async (config: any) => {
  const FMT_BASE = ".forestry/front_matter/templates";
  const SETTINGS_PATH = "/.forestry/settings.yml";
  const PATH_TO_TEMPLATES = config.rootPath + "/" + FMT_BASE;

  const _getFMTFilename = (name: string) =>
    getFMTFilename(name, PATH_TO_TEMPLATES);

  const replaceFMTPathWithSlug = (path: string) => {
    // FIXME: we reference the slug in "select" fields
    return path.replace(config.sectionPrefix, "");
  };
  const settings = await getData<Settings>(config.rootPath + SETTINGS_PATH);

  const fmtList = await getDirectoryList(PATH_TO_TEMPLATES);

  const templateInputObjectTypes: {
    [key: string]: GraphQLInputObjectType;
  } = {};
  const templateFormObjectTypes: { [key: string]: GraphQLObjectType } = {};
  const templateDataObjectTypes: TemplatesData = {};
  const templateObjectTypes: Templates = {};

  fmtList.forEach((path) => {
    templateObjectTypes[_getFMTFilename(path)] = null;
  });

  const templatePages = await Promise.all(
    fmtList.map(async (fmt) => {
      return {
        name: _getFMTFilename(fmt),
        pages: (await getData<FMT>(fmt)).data.pages,
      };
    })
  );

  const sectionFmts = settings.data.sections
    .filter(isDirectorySection)
    .map(({ path, templates }) => ({
      name: replaceFMTPathWithSlug(path),
      templates,
    }));

  await Promise.all(
    fmtList.map(async (path) => {
      const fmtFilename = _getFMTFilename(path);

      const fmt = await getData<FMT>(path);

      const { getters, setters, mutators } = generateFields({
        fmt: friendlyName(fmtFilename),
        fields: fmt.data.fields,
        rootPath: config.rootPath,
        templatePages,
        sectionFmts,
        templateObjectTypes,
        templateFormObjectTypes,
        templateDataObjectTypes,
        templateInputObjectTypes,
        pathToTemplates: PATH_TO_TEMPLATES,
      });

      const templateInputObjectType = new GraphQLInputObjectType({
        name: friendlyName(fmtFilename + "_input"),
        fields: mutators,
      });

      const templateFormObjectType = buildGroupSetter({
        name: friendlyName(fmtFilename + "_field_config"),
        setters,
        field: fmt.data,
      });

      const templateDataObjectType = new GraphQLObjectType({
        name: friendlyName(fmtFilename + "_data"),
        fields: {
          _template: {
            type: GraphQLString,
            resolve: () => friendlyName(fmtFilename + "_field_config"),
          },
          ...getters,
        },
      });

      const templateObjectType = new GraphQLObjectType({
        name: friendlyName(fmtFilename),
        fields: {
          form: {
            type: templateFormObjectType,
            resolve: (value) => {
              return value;
            },
          },
          absolutePath: { type: GraphQLNonNull(GraphQLString) },
          path: { type: GraphQLNonNull(GraphQLString) },
          content: {
            type: GraphQLNonNull(GraphQLString),
          },
          excerpt: { type: GraphQLString },
          data: { type: GraphQLNonNull(templateDataObjectType) },
        },
      });

      templateInputObjectTypes[fmtFilename] = templateInputObjectType;
      templateFormObjectTypes[fmtFilename] = templateFormObjectType;
      templateDataObjectTypes[fmtFilename] = templateDataObjectType;
      templateObjectTypes[fmtFilename] = templateObjectType;
    })
  );

  const documentType = new GraphQLUnionType({
    name: friendlyName("document_union"),
    types: () => {
      const sectionTemplates = flatten(
        settings.data.sections
          .filter(isDirectorySection)
          .map(({ templates }) => templates)
      );
      const types = sectionTemplates
        .map((sectionTemplate) => templateObjectTypes[sectionTemplate])
        ?.filter(isNotNull) || [
        new GraphQLObjectType({ name: "Woops", fields: {} }), // FIXME fallback to providing a type
      ];

      return types;
    },
    resolveType: (val) => {
      return templateObjectTypes[val.template];
    },
  });

  const documentInputType = {
    type: new GraphQLInputObjectType({
      name: "DocumentInput",
      fields: () => {
        const sectionTemplates = flatten(
          settings.data.sections
            .filter(isDirectorySection)
            .map(({ templates }) => templates)
        );

        return arrayToObject<GraphQLInputObjectType>(
          sectionTemplates
            .map((sectionTemplate) => templateInputObjectTypes[sectionTemplate])
            ?.filter(isNotNull),
          (obj, item) => {
            obj[getNamedType(item).toString()] = { type: item };
          }
        );
      },
    }),
  };

  const rootQuery = new GraphQLObjectType({
    name: "Query",
    fields: {
      document: {
        type: documentType,
        args: {
          path: { type: GraphQLNonNull(GraphQLString) },
        },
        resolve: async (_, args): Promise<DocumentType> => {
          const activeTemplate = templatePages.find(({ pages }) => {
            return pages?.includes(args.path);
          });

          const document = await getData<DocumentType>(
            config.rootPath + "/" + args.path
          );

          return {
            ...document,
            path: args.path,
            template: activeTemplate?.name || "",
          };
        },
      },
    },
  });
  const rootMutation = new GraphQLObjectType({
    name: "Mutation",
    fields: {
      document: {
        type: documentType,
        args: {
          path: { type: GraphQLNonNull(GraphQLString) },
          params: documentInputType,
        },
      },
    },
  });

  const schema = new GraphQLSchema({
    query: rootQuery,
    mutation: rootMutation,
  });

  const documentMutation = (payload: any) => {
    console.log("mutation:", JSON.stringify(payload, null, 2));
  };

  return { schema, documentMutation };
};

const app = express();
app.use(cors());
app.use(
  "/graphql",
  graphqlHTTP(async () => {
    const configPath = path.resolve(process.cwd() + "/.forestry/config.js");
    const userConfig = require(configPath);
    const config = {
      rootPath: process.cwd(),
      ...userConfig,
    };
    const { schema, documentMutation } = await buildSchema(config);
    await fs.writeFileSync(
      __dirname + "/../src/schema.gql",
      printSchema(schema)
    );
    const querySchema = await fs
      .readFileSync(__dirname + "/../src/query.gql")
      .toString();

    const res = await codegen({
      // used by a plugin internally, although the 'typescript' plugin currently
      // returns the string output, rather than writing to a file
      filename: __dirname + "/../src/schema.ts",
      // schema: parse(printSchema(schema)),
      schema: parse(printSchema(schema)),
      documents: [
        {
          location: "operation.graphql",
          document: parse(querySchema),
        },
      ],
      config: {},
      plugins: [{ typescript: {} }, { typescriptOperations: {} }],
      pluginMap: {
        typescript: {
          plugin: typescriptPlugin,
        },
        typescriptOperations: {
          plugin: typescriptOperationsPlugin,
        },
      },
    });
    await fs.writeFileSync(
      process.cwd() + "/.forestry/types.ts",
      `// DO NOT MODIFY THIS FILE. This file is automatically generated by Forestry
${res}
    `
    );

    const query = await fs.readFileSync(__dirname + "/../src/query.gql");
    await fs.writeFileSync(
      process.cwd() + "/.forestry/query.ts",
      `// DO NOT MODIFY THIS FILE. This file is automatically generated by Forestry
export default \`${query}\`
`
    );

    return {
      schema,
      rootValue: {
        document: documentMutation,
      },
      graphiql: true,
      customFormatErrorFn(err: GraphQLError) {
        console.log(err);
        return {
          message: err.message,
          locations: err.locations,
          path: err.path,
        };
      },
    };
  })
);
app.listen(4001);

// mutation DocumentMutation($path: String!) {
//   document(
//     path: $path
//     params: {
//       BlockPage_input: {
//         title: "Hello"
//         blocks: [
//           {
//             Sidecar_input: {
//               text: "This is my text"
//               image: "some-image-path"
//               cta: { header: "" }
//               style: ""
//             }
//           },
//           { ExcerptPost_input: { description: "" } },
//           {
//             PriceList_input: {
//               heading: "strin"
//               prices: [
//                 {
//                   title: "HEre"
//                   description: "we"
//                   bullet_points: ["has", "tobe"]
//                 }
//               ]
//             }
//           }
//           { SponsorList_input: { sponsor: { name: "hi", url: "", image: "" } } }
//         ]
//       }
//     }
//   ) {
//     __typename
//   }
// }
