import { FieldAccessorTypes, FieldData } from "./types";
import type { GenerateFieldAccessorsFunction } from "../fieldGenerator";

import { FieldType } from "../datasources/datasource";
import { GraphQLError } from "graphql";
import { blocks } from "./blocks";
import { boolean } from "./boolean";
import { datetime } from "./datetime";
import { field_group } from "./fieldgroup";
import { field_group_list } from "./fieldgrouplist";
import { file } from "./file";
import { image_gallery } from "./imagegallery";
import { list } from "./list";
import { number } from "./number";
import { select } from "./select";
import { tag_list } from "./taglist";
import { text } from "./text";
import { textarea } from "./textarea";

export const getFieldType = ({
  fmt,
  field,
  config,
  fieldData,
  generateFieldAccessors,
}: {
  fmt: string;
  field: FieldType;
  config: { rootPath: string; siteLookup: string };
  fieldData: FieldData;
  generateFieldAccessors: GenerateFieldAccessorsFunction;
}): FieldAccessorTypes => {
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
      return field_group({
        fmt,
        field,
        config,
        fieldData,
        generateFieldAccessors,
      });
    case "field_group_list":
      return field_group_list({
        fmt,
        field,
        config,
        fieldData,
        generateFieldAccessors,
      });
    case "blocks":
      return blocks({ field, config, fieldData });
    default:
      throw new GraphQLError(
        `No function provided for field type ${JSON.stringify(field)}`
      );
  }
};
