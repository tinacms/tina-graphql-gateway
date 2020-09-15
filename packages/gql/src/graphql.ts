import { graphql } from "graphql";
import type {
  GraphQLSchema,
  GraphQLFieldResolver,
  GraphQLTypeResolver,
  Source,
} from "graphql";
import { isDocumentArgs } from "./datasources/datasource";
import { text } from "./fields/text";
import { textarea } from "./fields/textarea";
import { select } from "./fields/select";
import { blocks } from "./fields/blocks";
import { fieldGroup } from "./fields/field-group";
import type {
  DataSource,
  TinaDocument,
  DocumentPartial,
} from "./datasources/datasource";

export type ContextT = {
  datasource: DataSource;
};

type FieldResolverArgs = undefined | { path: string };
export const documentTypeResolver: GraphQLTypeResolver<
  TinaDocument,
  ContextT
> = (value, context, info) => {
  if (info.fieldName === "fields") {
    return value.component;
  }
  // FIXME: for blocks which have a 'template' field
  if (value.template === "section") {
    return "SectionData";
  }
  return value._template;
};

type FieldResolverSource = undefined | TinaDocument | DocumentPartial;

export const fieldResolver: GraphQLFieldResolver<
  FieldResolverSource,
  ContextT,
  FieldResolverArgs
> = (source, args, context, info) => {
  const { datasource } = context;

  if (!source) {
    if (isDocumentArgs(args)) {
      return select.getter({ value: args.path, datasource });
    } else {
      throw new Error(`Unknown args for query ${args}`);
    }
  } else {
    if (source.component) {
      return source[info.fieldName];
    }
    if (source._resolverKind === "setter") {
      // console.log(source, info.fieldName);
      return source[info.fieldName];
    } else {
      const field = source?._fields[info.fieldName];
      const value = source[info.fieldName];

      if (field?.type === "textarea") {
        return text.getter({ value, field });
      }

      if (field?.type === "textarea") {
        return textarea.getter({ value, field });
      }

      if (field?.type === "select") {
        return select.getter({ value, field, datasource });
      }

      if (field?.type === "blocks") {
        return blocks.getter({ value, field, datasource });
      }

      if (field?.type === "field-group") {
        return fieldGroup.getter({
          value,
          field,
          datasource,
        });
      }
      if (info.fieldName === "form") {
        return {
          _resolverKind: "setter",
          fields: [
            {
              name: "title",
              label: "Title",
              description: "",
              component: "textarea",
            },
          ],
        };
      }
    }

    throw new Error(`Unknown field ${info.fieldName}`);
  }
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
    typeResolver: documentTypeResolver,
  });
};
