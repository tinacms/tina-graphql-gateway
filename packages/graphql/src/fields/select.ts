import {
  DocumentSelect,
  FieldType,
  SelectField,
} from "../datasources/datasource";
import { DocumentType, FieldContextType, FieldSourceType } from "./types";
import {
  GraphQLEnumType,
  GraphQLError,
  GraphQLString,
  GraphQLUnionType,
} from "graphql";
import {
  friendlyName,
  getFmtForDocument,
  getPagesForSection,
  getSectionFmtTypes2,
  isSectionSelectField,
  isString,
} from "../util";

import { selectInput } from "./inputFields";

function isSelectField(field: FieldType): field is SelectField {
  return field.type === "select";
}

function isDocumentSelectField(field: FieldType): field is DocumentSelect {
  if (!isSelectField(field)) {
    return false;
  }
  return field?.config?.source?.type === "documents";
}
export const select = ({
  fmt,
  field,
  config,
  fieldData,
}: {
  fmt: string;
  field: SelectField;
  config: { rootPath: string; siteLookup: string };
  fieldData: {
    sectionFmts: any;
    templateObjectTypes: any;
    templatePages: any;
    templateDataObjectTypes: any;
    templateFormObjectTypes: any;
    templateDataInputObjectTypes: any;
  };
}) => {
  if (isDocumentSelectField(field)) {
    return {
      getter: {
        type: GraphQLString,
      },
      setter: {
        type: selectInput,
        resolve: async (
          val: FieldSourceType,
          _args: { [argName: string]: any },
          ctx: FieldContextType
        ) => {
          const filepath = field.config?.source.file;
          if (!filepath) {
            throw new GraphQLError(
              `No path specificied for list field ${field.name}
                `
            );
          }
          const keyPath = field.config?.source.path;
          if (!keyPath) {
            throw new GraphQLError(
              `No path specificied key for list field document ${field.name}
                `
            );
          }
          const res = await ctx.dataSource.getData<any>("", filepath);
          return {
            name: field.name,
            label: field.label,
            component: "select",
            options: Object.keys(res.data[keyPath]),
          };
        },
      },
      mutator: {
        type: GraphQLString,
      },
    };
  }

  if (isSectionSelectField(field)) {
    return {
      getter: {
        type: new GraphQLUnionType({
          name: friendlyName(field.name + "_select_" + fmt),
          types: () => {
            return getSectionFmtTypes2(
              field.config.source.section,
              fieldData.sectionFmts,
              fieldData.templateObjectTypes
            );
          },
          resolveType: async (val) => {
            return fieldData.templateObjectTypes[val.template];
          },
        }),
        resolve: async (
          val: { [key: string]: unknown },
          _args: { [argName: string]: any },
          ctx: FieldContextType
        ) => {
          const path = val[field.name];
          if (isString(path)) {
            const res = await ctx.dataSource.getData<DocumentType>(
              config.siteLookup,
              path
            );
            const activeTemplate = getFmtForDocument(
              path,
              fieldData.templatePages
            );
            return {
              ...res,
              path: val[field.name],
              template: activeTemplate?.name,
            };
          }

          throw new GraphQLError(
            `Expected index lookup to return a string for ${field.name}`
          );
        },
      },
      setter: {
        type: selectInput,
        resolve: () => {
          if (field?.config?.source?.type === "pages") {
            const options = getPagesForSection(
              field.config.source.section,
              fieldData.sectionFmts,
              fieldData.templatePages
            );
            return {
              ...field,
              component: "select",
              options,
            };
          }

          return {
            name: field.name,
            label: field.label,
            component: "select",
            options: ["this shouldn", "be seen"],
          };
        },
      },
      mutator: {
        type: GraphQLString,
      },
    };
  }

  const options: { [key: string]: { value: string } } = {};
  field.config?.options.forEach(
    (option) => (options[option] = { value: option })
  );

  return {
    getter: {
      type: GraphQLString,
    },
    setter: {
      type: selectInput,
      resolve: () => {
        return {
          name: field.name,
          label: field.label,
          component: "select",
          options: field.config.options,
        };
      },
    },
    mutator: {
      type: new GraphQLEnumType({
        name: friendlyName(field.name + "_select_" + fmt),
        values: options,
      }),
    },
  };
};
