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

export type InitialSource = {
  [key: string]: {
    _resolver: "_initial_source";
  };
};
export type TinaDocument = {
  [key: string]: {
    _resolver: "select_data";
  };
};
export type TinaSelectFormField = {
  [key: string]: {
    _resolver: "select_form";
    field: SelectField;
  };
};
export type TinaDataFormField = {
  [key: string]: {
    _resolver: "select_data";
    field: SelectField;
    value: string;
  };
};

type FieldResolverSource =
  | InitialSource
  | TinaDataFormField
  | TinaSelectFormField;

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
    return;
  }

  switch (value._resolver) {
    case "_initial_source":
      const realArgs = Object.keys(args).length === 0 ? value._args : args;
      if (value._args) {
        return {
          document: await resolveDocument({ args: realArgs, datasource }),
        };
      } else if (value._margs) {
        return {
          documents: await Promise.all(
            value._margs.paths.map(async (p) => {
              return await resolveDocument({ args: { path: p }, datasource });
            })
          ),
        };
      } else {
        return await resolveDocument({ args: realArgs, datasource });
      }
    default:
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
    rootValue: { document: { _resolver: "_initial_source" } },
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
    [key: string]: string | object | string[] | object[];
  }
) => Promise<ResolvedData>;
const resolveData: resolveDataType = async (
  datasource,
  resolvedTemplate,
  data
) => {
  const accum: { [key: string]: any } = data;
  const fields: { [key: string]: Field } = {};
  const dataKeys = Object.keys(data);

  await Promise.all(
    dataKeys.map(async (key) => {
      const field = resolvedTemplate.fields.find((f) => f.name === key);
      if (!field) {
        throw new Error(`Unable to find field for item with name: ${key}`);
      }
      const value = accum[key];

      return (fields[key] = await resolveDataField(datasource, field, value));
    })
  );
  return {
    __typename: `${resolvedTemplate.label}Data`,
    ...fields,
  };
};

const resolveDataField = async (
  datasource: DataSource,
  field: Field,
  value: any
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
      console.warn(field.type, value);
      return value;
  }
};
