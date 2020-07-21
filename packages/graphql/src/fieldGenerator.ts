import { FieldContextType, FieldSourceType } from "./fields/types";
import {
  GraphQLError,
  GraphQLFieldConfig,
  GraphQLInputType,
  GraphQLObjectType,
  GraphQLType,
} from "graphql";
import {
  boolean,
  datetime,
  field_group,
  file,
  image_gallery,
  list,
  number,
  select,
  tag_list,
  text,
  textarea,
} from "./fields";

import { FieldType } from "./datasources/datasource";
import { blocks } from "./fields/blocks";
import { field_group_list } from "./fields/fieldgrouplist";

export type generatedFieldsType = {
  getters: {
    [key: string]: fieldGetter;
  };
  setters: {
    [key: string]: fieldSetter;
  };
  mutators: {
    [key: string]: { type: GraphQLInputType };
  };
};

type fieldGetter = GraphQLFieldConfig<
  FieldSourceType,
  FieldContextType,
  {
    [argName: string]: GraphQLType;
  }
>;
export type fieldSetter = {
  // FIXME: any should be replaced with the resolver function payload type
  type: GraphQLObjectType<any>;
  resolve: (
    val: FieldSourceType,
    args: {
      [argName: string]: unknown;
    },
    context: FieldContextType,
    info: unknown
  ) => unknown;
};
export type fieldTypeType = {
  getter: fieldGetter;
  setter: fieldSetter;
  mutator: { type: GraphQLInputType };
};

export const generateFields = ({
  fmt,
  fields,
  config,
  fieldData,
}: {
  fmt: string;
  fields: FieldType[];
  config: { rootPath: string; siteLookup: string };
  fieldData: {
    sectionFmts: any;
    templateObjectTypes: any;
    templatePages: any;
    templateDataObjectTypes: any;
    templateFormObjectTypes: any;
    templateDataInputObjectTypes: any;
  };
}): generatedFieldsType => {
  const accumulator: generatedFieldsType = {
    getters: {},
    setters: {},
    mutators: {},
  };

  fields.forEach((field) => {
    const { getter, setter, mutator } = getFieldType({
      fmt,
      field,
      config,
      fieldData,
    });
    accumulator.getters[field.name] = getter;
    accumulator.setters[field.name] = setter;
    accumulator.mutators[field.name] = mutator;
  });

  return {
    getters: accumulator.getters,
    setters: accumulator.setters,
    mutators: accumulator.mutators,
  };
};

export const getFieldType = ({
  fmt,
  field,
  config,
  fieldData,
}: {
  fmt: string;
  field: FieldType;
  config: { rootPath: string; siteLookup: string };
  fieldData: {
    sectionFmts: any;
    templateObjectTypes: any;
    templatePages: any;
    templateDataObjectTypes: any;
    templateFormObjectTypes: any;
    templateDataInputObjectTypes: any;
  };
}): fieldTypeType => {
  switch (field.type) {
    case "text":
      return text({ fmt, field });
    case "textarea":
      return textarea({ fmt, field });
    case "number":
      return number({ fmt, field });
    case "boolean":
      return boolean({ fmt, field });
    case "select":
      return select({ fmt, field, config, fieldData });
    case "datetime":
      return datetime({ fmt, field });
    case "tag_list":
      return tag_list({ fmt, field });
    case "list":
      return list({ fmt, field, config, fieldData });
    case "file":
      return file({ fmt, field, config });
    case "image_gallery":
      return image_gallery({ fmt, field, config });
    case "field_group":
      return field_group({ fmt, field, config, fieldData });
    case "field_group_list":
      return field_group_list({ fmt, field, config, fieldData });
    case "blocks":
      return blocks({ fmt, field, config, fieldData });
    default:
      throw new GraphQLError(
        `No function provided for field type ${JSON.stringify(field)}`
      );
  }
};
