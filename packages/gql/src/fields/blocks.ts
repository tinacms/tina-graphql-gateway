import type { Field } from "./index";
import type { DataSource } from "../datasources/datasource";
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLUnionType,
} from "graphql";
import type { Cache } from "../schema-builder";

export type BlocksField = {
  label: string;
  name: string;
  type: "blocks";
  default: string;
  template_types: string[];
  config?: {
    required?: boolean;
  };
};

type FieldMap = { [key: string]: Field };
const getter = async ({
  value,
  field,
  datasource,
}: {
  value: { template: string; [key: string]: unknown }[];
  field: BlocksField;
  datasource: DataSource;
}): Promise<{ _fields: FieldMap; [key: string]: unknown }[]> => {
  return Promise.all(
    value.map(async (value) => {
      const template = await datasource.getTemplate({ slug: value.template });
      const fields: { [key: string]: Field } = {};
      template.fields.forEach((field) => (fields[field.name] = field));

      return {
        _fields: fields,
        ...value,
      };
    })
  );
};

const builder = {
  /** Returns one of 3 possible types of select options */
  setter: async ({ cache, field }: { cache: Cache; field: BlocksField }) => {
    // return GraphQLString;
    return cache.build(
      new GraphQLObjectType({
        name: "BlocksFormField",
        fields: {
          name: { type: GraphQLString },
          label: { type: GraphQLString },
          component: { type: GraphQLString },
          templates: {
            type: await cache.builder.buildDataUnion({
              cache,
              templates: field.template_types,
            }),
          },
        },
      })
    );
  },
  getter: async ({ cache, field }: { cache: Cache; field: BlocksField }) => {},
};

export const blocks = {
  getter,
  builder,
};
