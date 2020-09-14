import { graphql } from "graphql";
import type {
  GraphQLSchema,
  GraphQLFieldResolver,
  GraphQLTypeResolver,
  Source,
} from "graphql";
import { isDocumentArgs } from "./datasources/datasource";
import { text } from "./fields/text";
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
  nextOperation?: {
    name: "getData" | "getSettings";
    args: undefined | { path: string }; // use conditional types here
  };
};

type FieldResolverArgs = undefined | { path: string };
export const documentTypeResolver: GraphQLTypeResolver<
  TinaDocument,
  ContextT
> = (value) => {
  // FIXME: for blocks which have a 'template' field
  if (value.template === "section") {
    return "SectionData";
  }
  return value._template;
};

type FieldResolverSource = undefined | TinaDocument | DocumentPartial;

const GETTER = "getter";
const SETTER = "setter";
const MUTATOR = "mutator";

export const fieldResolver: GraphQLFieldResolver<
  FieldResolverSource,
  ContextT,
  FieldResolverArgs
> = (source, args, context, info): any => {
  const { datasource } = context;

  if (!source) {
    if (isDocumentArgs(args)) {
      return select.getter({ value: args.path, datasource });
    }
  } else {
    const field = source?._fields[info.fieldName];
    const value = source[info.fieldName];

    if (field?.type === "textarea") {
      return text.getter({ value, field });
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
