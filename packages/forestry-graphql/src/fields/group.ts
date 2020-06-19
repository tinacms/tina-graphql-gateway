import { friendlyName } from "../formatFmt";

import {
  GraphQLFieldConfig,
  GraphQLType,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLUnionType,
  GraphQLInputObjectType,
  GraphQLInputType,
} from "graphql";
import {
  WithFields,
  FieldContextType,
  FieldSourceType,
  FieldType,
  Templates,
  TemplatePage,
} from "../fieldTypes";
import camelCase from "lodash.camelcase";
import { text } from "../fields/text";
import { textarea } from "../fields/textarea";
import { number } from "../fields/number";
import { boolean } from "../fields/boolean";
import { select } from "../fields/select";
import { datetime } from "../fields/datetime";
import { tag_list } from "../fields/tagList";
import { list } from "../fields/list";
import { file } from "../fields/file";
import { image_gallery } from "../fields/imageGallery";
import { blocks } from "../fields/blocks";

export const generateFields = ({
  fmt,
  fields,
  rootPath,
  sectionFmts,
  templateObjectTypes,
  templateInputObjectTypes,
  templateDataObjectTypes,
  templateFormObjectTypes,
  templatePages,
  pathToTemplates,
}: {
  fmt: string;
  fields: FieldType[];
  rootPath: string;
  sectionFmts: {
    name: string;
    templates: string[];
  }[];
  templateObjectTypes: Templates;
  templateInputObjectTypes: {
    [key: string]: GraphQLInputObjectType;
  };
  templateDataObjectTypes: { [key: string]: GraphQLObjectType };
  templateFormObjectTypes: { [key: string]: GraphQLObjectType };
  templatePages: TemplatePage[];
  pathToTemplates: string;
}) => {
  const accumulator: {
    getters: {
      [key: string]: GraphQLFieldConfig<
        FieldSourceType,
        FieldContextType,
        {
          [argName: string]: GraphQLType;
        }
      >;
    };
    setters: {
      [key: string]: GraphQLFieldConfig<
        FieldSourceType,
        FieldContextType,
        {
          [argName: string]: GraphQLType;
        }
      >;
    };
    mutators: {
      [key: string]: { type: GraphQLInputType };
    };
  } = { getters: {}, setters: {}, mutators: {} };

  fields.forEach((field) => {
    const { getter, setter, mutator } = getFieldType({
      fmt,
      field,
      rootPath,
      sectionFmts,
      templateObjectTypes,
      templatePages,
      pathToTemplates,
      templateInputObjectTypes,
      templateDataObjectTypes,
      templateFormObjectTypes,
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

/**
 * this function is used to help recursively set the `setter` for groups.
 * it currently treats groups and group-lists similarly which should be fixed
 */
export const buildGroupSetter = ({
  name,
  setters,
  field,
}: {
  name: string;
  setters: {
    [key: string]: GraphQLFieldConfig<
      FieldSourceType,
      FieldContextType,
      {
        [argName: string]: GraphQLType;
      }
    >;
  };
  field: WithFields;
}) => {
  const array = Object.values(setters);
  const types = Array.from(new Set(array.map((item: any) => item.type)));
  return new GraphQLObjectType({
    name: name,
    fields: {
      label: {
        type: GraphQLString,
        resolve: () => {
          return field.label;
        },
      },
      key: {
        type: GraphQLString,
        resolve: () => {
          return camelCase(field.label);
        },
      },
      name: { type: GraphQLString, resolve: () => field.name },
      component: {
        type: GraphQLString,
        resolve: () => {
          return field.type === "field_group_list" ? "group-list" : "group";
        },
      },
      fields: {
        type: GraphQLList(
          new GraphQLUnionType({
            name: name + "_component_config",
            types,
            // @ts-ignore
            resolveType: (val) => {
              return setters[val.name]?.type || types[0];
            },
          })
        ),
        resolve: async (source, args, context, info) => {
          return Promise.all(
            field.fields.map(async (field) => {
              // FIXME: calling resolve manually here, probably a sign that this is in the wrong place
              const res = setters[field.name];
              // @ts-ignore
              return res?.resolve(field, args, context, info);
            })
          );
        },
      },
    },
  });
};

const getFieldType = ({
  fmt,
  field,
  rootPath,
  sectionFmts,
  templateObjectTypes,
  templateInputObjectTypes,
  templateFormObjectTypes,
  templateDataObjectTypes,
  templatePages,
  pathToTemplates,
}: {
  fmt: string;
  field: FieldType;
  rootPath: string;
  sectionFmts: {
    name: string;
    templates: string[];
  }[];
  templateObjectTypes: Templates;
  templateInputObjectTypes: {
    [key: string]: GraphQLInputObjectType;
  };
  templateDataObjectTypes: { [key: string]: GraphQLObjectType };
  templateFormObjectTypes: { [key: string]: GraphQLObjectType };
  templatePages: TemplatePage[];
  pathToTemplates: string;
}): {
  getter: GraphQLFieldConfig<
    FieldSourceType,
    FieldContextType,
    {
      [argName: string]: GraphQLType;
    }
  >;
  setter: GraphQLFieldConfig<
    FieldSourceType,
    FieldContextType,
    {
      [argName: string]: GraphQLType;
    }
  >;
  mutator: { type: GraphQLInputType };
} => {
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
      return select({
        fmt,
        field,
        rootPath: rootPath,
        sectionFmts,
        templateObjectTypes,
        templatePages,
      });
    case "datetime":
      return datetime({ fmt, field });
    case "tag_list":
      return tag_list({ fmt, field });
    case "list":
      return list({
        fmt,
        field,
        rootPath: rootPath,
        sectionFmts,
        templateObjectTypes,
        templatePages,
      });
    case "file":
      return file({ fmt, field, rootPath: rootPath });
    case "image_gallery":
      return image_gallery({ fmt, field, rootPath: rootPath });
    case "field_group":
      return field_group({
        fmt,
        field,
        rootPath: rootPath,
        sectionFmts,
        templateObjectTypes,
        templateInputObjectTypes,
        templateDataObjectTypes,
        templateFormObjectTypes,
        templatePages,
        pathToTemplates,
      });
    case "field_group_list":
      return field_group_list({
        fmt,
        field,
        rootPath: rootPath,
        sectionFmts,
        templateObjectTypes,
        templatePages,
        templateInputObjectTypes,
        templateDataObjectTypes,
        templateFormObjectTypes,
        pathToTemplates,
      });
    case "blocks":
      return blocks({
        fmt,
        field,
        templateInputObjectTypes,
        templateDataObjectTypes,
        templateFormObjectTypes,
        pathToTemplates,
      });
    default:
      // FIXME just a placeholder
      return text({ fmt, field });
  }
};

export type FieldGroupField = WithFields & {
  label: string;
  name: string;
  type: "field_group";
  config?: {
    required?: boolean;
  };
};

export const field_group = ({
  fmt,
  field,
  rootPath,
  sectionFmts,
  templateObjectTypes,
  templateFormObjectTypes,
  templateDataObjectTypes,
  templateInputObjectTypes,
  templatePages,
  pathToTemplates,
}: {
  fmt: string;
  field: FieldGroupField;
  rootPath: string;
  sectionFmts: {
    name: string;
    templates: string[];
  }[];
  templateObjectTypes: Templates;
  templatePages: TemplatePage[];
  templateInputObjectTypes: {
    [key: string]: GraphQLInputObjectType;
  };
  templateDataObjectTypes: { [key: string]: GraphQLObjectType };
  templateFormObjectTypes: { [key: string]: GraphQLObjectType };
  pathToTemplates: string;
}) => {
  const { getters, setters, mutators } = generateFields({
    fmt: `${fmt}_${field.name}`,
    fields: field.fields,
    rootPath,
    sectionFmts,
    templateObjectTypes,
    templateFormObjectTypes,
    templateDataObjectTypes,
    templateInputObjectTypes,
    templatePages,
    pathToTemplates,
  });
  return {
    getter: {
      type: new GraphQLObjectType({
        name: friendlyName(field.name + "_fields_" + fmt),
        fields: getters,
      }),
    },
    setter: {
      type: buildGroupSetter({
        name: friendlyName(field.name + "_fields_list_" + fmt + "_config"),
        setters: setters,
        field,
      }),
      resolve: (value: any) => {
        return value;
      },
    },
    mutator: {
      type: new GraphQLInputObjectType({
        name: friendlyName(field.name + "_fields_" + fmt + "_input"),
        fields: mutators,
      }),
    },
  };
};

export type FieldGroupListField = WithFields & {
  label: string;
  name: string;
  type: "field_group_list";
  config?: {
    required?: boolean;
  };
};

export const field_group_list = ({
  fmt,
  field,
  rootPath,
  sectionFmts,
  templateObjectTypes,
  templateFormObjectTypes,
  templateDataObjectTypes,
  templateInputObjectTypes,
  templatePages,
  pathToTemplates,
}: {
  fmt: string;
  field: FieldGroupListField;
  rootPath: string;
  sectionFmts: {
    name: string;
    templates: string[];
  }[];
  templateObjectTypes: Templates;
  templatePages: TemplatePage[];
  templateInputObjectTypes: {
    [key: string]: GraphQLInputObjectType;
  };
  templateDataObjectTypes: { [key: string]: GraphQLObjectType };
  templateFormObjectTypes: { [key: string]: GraphQLObjectType };
  pathToTemplates: string;
}) => {
  const { getters, setters, mutators } = generateFields({
    fmt: `${fmt}_${field.name}`,
    fields: field.fields,
    rootPath: rootPath,
    templatePages,
    sectionFmts,
    templateObjectTypes,
    templateFormObjectTypes,
    templateDataObjectTypes,
    templateInputObjectTypes,
    pathToTemplates,
  });
  return {
    getter: {
      type: GraphQLList(
        new GraphQLObjectType({
          name: friendlyName(field.name + "_fields_list_" + fmt),
          fields: getters,
        })
      ),
    },
    setter: {
      type: buildGroupSetter({
        name: friendlyName(field.name + "_fields_list_" + fmt + "_config"),
        setters,
        field,
      }),
      resolve: (value: any) => {
        return value;
      },
    },
    mutator: {
      type: GraphQLList(
        new GraphQLInputObjectType({
          name: friendlyName(field.name + "_fields_list_" + fmt + "_input"),
          fields: mutators,
        })
      ),
    },
  };
};
