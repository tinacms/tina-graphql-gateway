import type { Field } from "./index";
import type { DataSource, DocumentArgs } from "../datasources/datasource";
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLUnionType,
} from "graphql";
import type { Cache } from "../schema-builder";
import { select } from "./select";

export type BaseListField = {
  label: string;
  name: string;
  type: "list";
};
export type SimpleList = BaseListField & {
  config: {
    required?: boolean;
    use_select: boolean;
    min: undefined | number;
    max: undefined | number;
    source: undefined;
  };
};
export type DocumentList = BaseListField & {
  config: {
    required?: boolean;
    use_select: boolean;
    min: undefined | number;
    max: undefined | number;
    source: {
      type: "documents";
      section: string;
      file: string;
      path: string;
    };
  };
};
export type SectionList = BaseListField & {
  config: {
    required?: boolean;
    use_select: boolean;
    min: undefined | number;
    max: undefined | number;
    source: {
      type: "pages";
      section: string;
    };
  };
};
export type ListField = SectionList | SimpleList | DocumentList;

const builders = {
  /** Returns one of 3 possible types of select options */
  formFieldBuilder: ({ cache, field }: { cache: Cache; field: ListField }) => {
    return cache.build(
      new GraphQLObjectType({
        name: "ListFormField",
        fields: {
          name: { type: GraphQLString },
          label: { type: GraphQLString },
          component: { type: GraphQLString },
          field: {
            type: new GraphQLObjectType({
              name: "ListFormFieldItemField",
              fields: {
                component: { type: GraphQLString }, // 'text' | 'textarea' | 'number' | 'select'
              },
            }),
          },
        },
      })
    );
  },
  dataFieldBuilder: async ({
    cache,
    field,
  }: {
    cache: Cache;
    field: ListField;
  }) => {
    let listTypeIdentifier: "simple" | "pages" | "documents" = "simple";
    const isSimple = field.config.use_select ? false : true;
    if (!isSimple) {
      listTypeIdentifier =
        field.config?.source?.type === "documents"
          ? "documents"
          : field.config?.source?.type === "pages"
          ? "pages"
          : "simple";
    }

    let list;
    switch (listTypeIdentifier) {
      case "documents":
        list = field as DocumentList;
        throw new Error(`document select not implemented`);
      case "pages":
        list = field as SectionList;
        const section = list.config.source.section;
        return {
          type: GraphQLList(
            await cache.builder.buildDocumentUnion({ cache, section })
          ),
        };
      case "simple":
        list = field as SimpleList;
        return { type: GraphQLList(GraphQLString) };
    }
  },
};
const resolvers = {
  formFieldBuilder: async (datasource: DataSource, field: ListField) => {
    const { type, ...rest } = field;

    let listTypeIdentifier: "simple" | "pages" | "documents" = "simple";
    const isSimple = field.config.use_select ? false : true;
    if (!isSimple) {
      listTypeIdentifier =
        field.config?.source?.type === "documents"
          ? "documents"
          : field.config?.source?.type === "pages"
          ? "pages"
          : "simple";
    }

    let fieldComponent: {
      component: "text" | "textarea" | "number" | "select";
      options?: string[];
    } = {
      component: "text",
    };
    let list;
    switch (listTypeIdentifier) {
      case "documents":
        list = field as DocumentList;
        throw new Error(`document list not implemented`);
      case "pages":
        list = field as SectionList;
        fieldComponent = await select.resolvers.formFieldBuilder(
          datasource,
          field
        );
        break;
      case "simple":
        list = field as SimpleList;
        break;
      // Do nothing, this is the default
    }

    return {
      ...rest,
      component: "list",
      field: fieldComponent,
      __typename: "ListFormField",
    };
  },
  dataFieldBuilder: async (
    datasource: DataSource,
    field: ListField,
    value,
    resolveData
  ) => {
    let listTypeIdentifier: "simple" | "pages" | "documents" = "simple";
    const isSimple = field.config.use_select ? false : true;
    if (!isSimple) {
      listTypeIdentifier =
        field.config?.source?.type === "documents"
          ? "documents"
          : field.config?.source?.type === "pages"
          ? "pages"
          : "simple";
    }
    let list;
    switch (listTypeIdentifier) {
      case "documents":
        list = field as DocumentList;
        throw new Error(`document list not implemented`);
      case "pages":
        list = field as SectionList;
        const meh = await Promise.all(
          value.map(async (item) => {
            console.log(field);
            const d = await datasource.getData({ path: item });
            return {
              // __typename: `${field.label}Data`,
              __typename: 'Author'
              ...d,
            };
          })
        );
        console.log(meh);
        return meh;
      case "simple":
        list = field as SimpleList;
        break;
      // Do nothing, this is the default
    }
    // console.log(value, field);
  },
};

export const list = {
  resolvers,
  builders,
};
