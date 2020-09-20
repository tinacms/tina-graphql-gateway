import { graphql } from "graphql";
import { GraphQLSchema, GraphQLFieldResolver, Source } from "graphql";
import _ from "lodash";
import type { TemplateData } from "./types";
import type { Field } from "./fields";
import { text } from "./fields/text";
import { textarea } from "./fields/textarea";
import { select, SelectField } from "./fields/select";
import { list } from "./fields/list";
import { blocks } from "./fields/blocks";
import { fieldGroup } from "./fields/field-group";
import { fieldGroupList } from "./fields/field-group-list";
import type { DataSource } from "./datasources/datasource";

export type ContextT = {
  datasource: DataSource;
};

type FieldResolverArgs = undefined | { path: string };

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

function isResource(item: unknown): item is InitialSource {
  return typeof item._resolver === "string";
}

export const fieldResolver: GraphQLFieldResolver<
  FieldResolverSource,
  ContextT,
  FieldResolverArgs
> = async (source, args, context, info) => {
  const value = source[info.fieldName];
  const { datasource } = context;

  // FIXME: these scenarios are valid in some cases but need to assert that
  if (!value) {
    // console.log(info.fieldName);
    // console.log(source);
    return null;
  }
  if (isResource(value)) {
    switch (value._resolver_kind) {
      case "_initial":
        if (!args) {
          throw new Error(`Expected args for initial document request`);
        }
        return resolveDocument({ args: args, datasource });
      case "_nested_source":
        return {
          document: await resolveDocument({ args: value._args, datasource }),
        };
      case "_nested_sources":
        return {
          documents: await Promise.all(
            value._args.paths.map(async (p) => {
              return await resolveDocument({ args: { path: p }, datasource });
            })
          ),
        };
    }
  } else {
    return value;
  }
};

type ResolveDocument = {
  __typename: string;
  content: string;
  form: ResolvedTemplate;
  path: string;
  data: ResolvedData;
};
const resolveDocument = async ({
  args,
  datasource,
}: {
  args: { path: string };
  datasource: DataSource;
}): Promise<ResolveDocument> => {
  const document = await datasource.getData(args);
  const template = await datasource.getTemplateForDocument(args);

  const resolvedTemplate = await resolveTemplate(datasource, template);
  const resolvedData = await resolveData(
    datasource,
    resolvedTemplate,
    document.data
  );
  // console.log(JSON.stringify(template, null, 2));

  return {
    __typename: template.label,
    content: "\nSome content\n",
    form: resolvedTemplate,
    path: args.path,
    data: resolvedData,
  };
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
    // typeResolver: (args) => {
    //   console.log(args);
    //   return args.__typename;
    // },
    rootValue: {
      document: {
        _resolver: "_resource",
        _resolver_kind: "_initial",
      },
    },
  });
};

type ResolvedTemplate = TemplateData & {
  __typename: string;
  fields: Field[];
};

export type resolveTemplateType = (
  datasource: DataSource,
  template: TemplateData
) => Promise<ResolvedTemplate>;
const resolveTemplate: resolveTemplateType = async (datasource, template) => {
  const accum: TemplateData & {
    __typename: string;
    fields: Field[];
  } = {
    __typename: template.label,
    ...template,
    fields: [],
  };

  await Promise.all(
    template.fields.map(async (field) =>
      accum.fields.push(await resolveField(datasource, field))
    )
  );

  return accum;
};

export type resolveFieldType = (
  datasource: DataSource,
  field: Field
) => Promise<any>;
const resolveField: resolveFieldType = async (datasource, field) => {
  switch (field.type) {
    case "textarea":
      return await textarea.resolvers.formFieldBuilder(field);
    case "blocks":
      return await blocks.resolvers.formFieldBuilder(
        datasource,
        field,
        resolveTemplate
      );
    case "select":
      return await select.resolvers.formFieldBuilder(datasource, field);
    case "list":
      return await list.resolvers.formFieldBuilder(datasource, field);
    case "field_group":
      return await fieldGroup.resolvers.formFieldBuilder(
        datasource,
        field,
        resolveField
      );
    case "field_group_list":
      return await fieldGroupList.resolvers.formFieldBuilder(
        datasource,
        field,
        resolveField
      );
    default:
      console.log(field);
      return field;
  }
};

type ResolvedData = {
  __typename: string;
  [key: string]: Field;
};
export type resolveDataType = (
  datasource: DataSource,
  field: TemplateData,
  data: {
    [key: string]: unknown;
  }
) => Promise<ResolvedData>;
const resolveData: resolveDataType = async (
  datasource,
  resolvedTemplate,
  data
) => {
  const dataKeys = Object.keys(data);

  await Promise.all(
    dataKeys.map(async (key) => {
      const field = resolvedTemplate.fields.find((f) => f.name === key);
      if (!field) {
        throw new Error(`Unable to find field for item with name: ${key}`);
      }
      const value = data[key];

      return (data[key] = await resolveDataField(datasource, field, value));
    })
  );
  return {
    __typename: `${resolvedTemplate.label}Data`,
    ...data,
  };
};

const resolveDataField = async (
  datasource: DataSource,
  field: Field,
  value: unknown
) => {
  switch (field.type) {
    case "textarea":
      return await textarea.resolvers.dataFieldBuilder(
        datasource,
        field,
        value
      );
    case "blocks":
      return await blocks.resolvers.dataFieldBuilder(
        datasource,
        field,
        value,
        resolveData
      );
    case "select":
      return await select.resolvers.dataFieldBuilder(datasource, field, value);
    case "list":
      return await list.resolvers.dataFieldBuilder(datasource, field, value);
    case "field_group":
      return await fieldGroup.resolvers.dataFieldBuilder(
        datasource,
        field,
        value,
        resolveData
      );
    case "field_group_list":
      return await fieldGroupList.resolvers.dataFieldBuilder(
        datasource,
        field,
        value,
        resolveData
      );
    default:
      throw new Error(
        `Unexpected type for data field resolver - ${field.type}`
      );
  }
};
