/**
Copyright 2021 Forestry.io Inc
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import glob from "fast-glob";
import path from "path";
import fs from "fs-extra";
import * as ts from "typescript";
import * as jsyaml from "js-yaml";
import * as yup from "yup";
import * as _ from "lodash";
import { successText } from "../../utils/theme";

const tinaPath = path.join(process.cwd(), ".tina");
const tinaTempPath = path.join(process.cwd(), ".tina/__generated__/temp");
const tinaConfigPath = tinaTempPath.replace("temp", "config");

const transformField = async (
  tinaField: TinaField,
  schema: TinaCloudSchema
) => {
  const field = (await yup
    .object()
    .shape({
      name: yup
        .string()
        .transform((value) => {
          return _.snakeCase(value);
        })
        .matches(
          /^[a-zA-Z0-9_]*$/,
          (message) =>
            `the name field can only contain alphanumeric characters and underscores, got ${message.value}`
        )
        .required("the name field is required"),
      label: yup.string().required(),
      type: yup
        .string()
        .oneOf(
          [
            "text",
            "textarea",
            "group",
            "blocks",
            "group-list",
            "number",
            "select",
            "image",
            "list",
            "reference",
            "reference-list",
            "toggle",
          ],
          (message) => {
            return `Expected one of ${message.values} but got ${message.value}`;
          }
        ),
    })
    // FIXME: casting back to TinaField, but probably
    // want to check the entire object, like 'options' for a select field
    .validate(tinaField)) as TinaField;

  if (field.type === "group") {
    return {
      ...field,
      type: "field_group",
      fields: await Promise.all(
        field.fields.map((field) => transformField(field, schema))
      ),
    };
  }
  if (field.type === "toggle") {
    return {
      ...field,
      type: "boolean",
    };
  }
  if (field.type === "group-list") {
    return {
      ...field,
      type: "field_group_list",
      fields: await Promise.all(
        field.fields.map((field) => transformField(field, schema))
      ),
    };
  }
  if (field.type === "reference") {
    yup
      .object({
        section: yup
          .string()
          .oneOf(schema.sections.map((section) => section.name)),
      })
      .validate(field);
    return {
      ...field,
      type: "select",
      config: {
        source: {
          type: "pages",
          section: field.section,
        },
      },
    };
  }
  if (field.type === "reference-list") {
    return {
      ...field,
      type: "list",
      config: {
        source: {
          type: "pages",
          section: field.section,
        },
      },
    };
  }
  return field;
};

const buildTemplate = async (
  definition: TinaCloudTemplate,
  schema: TinaCloudSchema
) => {
  yup
    .object()
    .shape({
      name: yup
        .string()
        .matches(
          /^[a-zA-Z0-9_-]*$/,
          (message) =>
            `the name field can only contain alphanumeric characters and underscores, got ${message.value}`
        )
        .required("the name field is required"),
    })
    .validate(definition);
  const outputYmlPath = path.resolve(
    path.join(
      tinaTempPath.replace("temp", "config").replace(".js", ""),
      `front_matter/templates/${definition.name}.yml`
    )
  );
  const output: { pages?: string[] } & typeof definition = { ...definition };
  output.fields = await Promise.all(
    definition.fields.map(async (field) => {
      if (field.type === "blocks") {
        const f = { ...field };
        // @ts-ignore
        f.template_types = await Promise.all(
          field.templates.map(async (template, index) => {
            await buildTemplate(template, schema);
            return template.name;
          })
        );
        f.templates = undefined;
        return f;
      }
      return transformField(field, schema);
    })
  );

  const templateString = "---\n" + jsyaml.dump(output);
  await fs.outputFile(outputYmlPath, templateString);
  return true;
};

export const compile = async () => {
  await fs.remove(tinaTempPath);
  await transpile(tinaPath, tinaTempPath);
  delete require.cache[require.resolve(`${tinaTempPath}/schema.js`)];
  const schemaFunc = require(`${tinaTempPath}/schema.js`);
  const schemaObject: TinaCloudSchema = schemaFunc.default.config;
  await compileInner(schemaObject);
};
export const compileInner = async (schemaObject: TinaCloudSchema) => {
  const sectionOutput = {
    ...schemaObject,
    sections: schemaObject.sections.map((section) => {
      return {
        ...section,
        type: "directory",
        create: "documents",
        match: "**/*.md",
        new_doc_ext: "md",
        templates: section.templates.map((template) => template.name),
      };
    }),
  };
  const schemaString = "---\n" + jsyaml.dump(sectionOutput);
  await fs.outputFile(
    path.join(tinaTempPath.replace("temp", "config"), "settings.yml"),
    schemaString
  );
  await Promise.all(
    schemaObject.sections.map(
      async (section) =>
        await Promise.all(
          section.templates.map(async (definition) => {
            await buildTemplate(definition, schemaObject);
          })
        )
    )
  );
  console.log(`Tina config ======> ${successText(tinaConfigPath)}`);
  await fs.remove(tinaTempPath);
};

const transpile = async (projectDir, tempDir) => {
  return Promise.all(
    glob
      .sync(`${projectDir}/**/*.ts`, {
        ignore: [`${projectDir}/__generated__/**/*.ts`],
      })
      .map(async function (file) {
        const fullPath = path.resolve(file);
        const contents = await fs.readFileSync(fullPath).toString();
        const newContent = ts.transpile(contents);
        await fs.outputFile(
          file.replace(projectDir, tempDir).replace(".ts", ".js"),
          newContent
        );
        return true;
      })
  );
};

yup.addMethod(yup.array, "oneOfSchemas", function (schemas) {
  return this.test(
    "one-of-schemas",
    "Not all items in ${path} match one of the allowed schemas",
    (items) => {
      if (typeof items === "undefined") {
        return;
      }
      return items.every((item) => {
        return schemas.some((schema, index) => {
          if (schema.isValidSync(item, { strict: true })) {
            return true;
          } else {
            if (item.type) {
              const isAType = yup
                .string()
                .oneOf(types)
                .required()
                .isValidSync(item.type, { strict: true });

              if (!isAType) {
                console.log(
                  `type must be one of ${types.join(", ")}, got ${item.type}`
                );
              } else {
                // TODO: provide better messages by validating the invalid
                // schema with the appropriate yup schema
                // const schema = schemaMap[item.type];
                // if (!schema) {
                //   console.log("no schema validate", item.type);
                // } else {
                //   console.log("about to validate", item, "with");
                //   try {
                //     TextAreaSchema.validateSync(item);
                //   } catch (e) {
                //     console.log(e.errors);
                //   }
                // }
              }
            }

            return false;
          }
        });
      });
    }
  );
});

const baseSchema = yup.object({
  label: yup.string().required(),
  name: yup.string().required(),
  description: yup.string(),
});
let types = [
  "text",
  "textarea",
  "select",
  "list",
  "group",
  "group-list",
  "blocks",
];

const TextSchema = baseSchema.label("text").shape({
  type: yup
    .string()
    .matches(/^text$/)
    .required(),
});
const TextAreaSchema = baseSchema.label("textarea").shape({
  type: yup
    .string()
    .matches(/^textarea$/)
    .required(),
});
const SelectSchema = baseSchema.label("select").shape({
  type: yup
    .string()
    .matches(/^select$/)
    .required(),
  options: yup.array().min(1).of(yup.string()).required(),
});
const ListSchema = baseSchema.label("list").shape({
  type: yup
    .string()
    .matches(/^list$/)
    .required(),
});
const GroupSchema = baseSchema.label("group").shape({
  type: yup
    .string()
    .matches(/^group$/)
    .required(),
  fields: yup.lazy(() =>
    yup
      .array()
      .min(1, (message) => `${message.path} must have at least 1 item`)
      // @ts-ignore custom method to mimic oneOf for objects https://github.com/jquense/yup/issues/69#issuecomment-496814887
      .oneOfSchemas(FieldSchemas)
      .required()
  ),
});
const GroupListSchema = baseSchema.label("group-list").shape({
  type: yup
    .string()
    .matches(/^group-list$/)
    .required(),
  fields: yup.lazy(() =>
    yup
      .array()
      .min(1, (message) => `${message.path} must have at least 1 item`)
      // @ts-ignore custom method to mimic oneOf for objects https://github.com/jquense/yup/issues/69#issuecomment-496814887
      .oneOfSchemas(FieldSchemas)
      .required()
  ),
});

const BlocksSchema = baseSchema.label("blocks").shape({
  type: yup
    .string()
    .matches(/^blocks$/)
    .required(),
  templates: yup.lazy(() =>
    yup
      .array()
      .min(1, (message) => `${message.path} must have at least 1 item`)
      .of(TemplateSchema)
      .required("templates is a required field")
  ),
});
let schemaMap = {
  text: TextSchema,
  textarea: TextAreaSchema,
  select: SelectSchema,
  list: ListSchema,
  group: GroupSchema,
  "group-list": GroupListSchema,
  blocks: BlocksSchema,
};
var FieldSchemas = [
  TextSchema,
  TextAreaSchema,
  SelectSchema,
  ListSchema,
  BlocksSchema,
  // FIXME: for some reason these mess up the blocks test if they're listed before it
  GroupSchema,
  GroupListSchema,
];

const TemplateSchema = yup.object({
  label: yup.string().required(),
  name: yup.string().required(),
  fields: yup
    .array()
    .min(1, (message) => `${message.path} must have at least 1 item`)
    // @ts-ignore custom method to mimic oneOf for objects https://github.com/jquense/yup/issues/69#issuecomment-496814887
    .oneOfSchemas(FieldSchemas)
    .required(),
});

export const defineSchema = (config: TinaCloudSchema) => {
  assertShape<TinaCloudSettings>(config, (yup) =>
    yup.object({
      sections: yup
        .array()
        .min(1, (message) => `${message.path} must have at least 1 item`)
        .of(
          yup.object({
            label: yup.string().required(),
            path: yup.string().required(),
            name: yup.string().required(),
            templates: yup
              .array()
              .min(1, (message) => `${message.path} must have at least 1 item`)
              .of(TemplateSchema)
              .required("templates is a required field"),
          })
        )
        .required("sections is a required field"),
    })
  );
  return { _definitionType: "schema", config };
};

export function assertShape<T extends object>(
  value: unknown,
  yupSchema: (args: typeof yup) => yup.AnySchema<unknown, unknown>
): asserts value is T {
  const shape = yupSchema(yup);
  shape.validateSync(value);
}

export interface TinaCloudSchema {
  sections: TinaCloudSection[];
}
export interface TinaCloudSettings {
  sections: TinaCloudSection[];
}
interface TinaCloudSection {
  path: string;
  name: string;
  label: string;
  templates: TinaCloudTemplate[];
}

export interface TinaCloudTemplate {
  label: string;
  name: string;
  fields: TinaField[];
}

export type TinaField =
  | TextField
  | NumberField
  | TextareaField
  | SelectField
  | ImageField
  | GroupField
  | GroupListField
  | ListField
  | ToggleField
  | TagsField
  | BlocksField
  | Reference
  | ReferenceList;

interface TinaBaseField {
  name: string;
  label: string;
  description?: string;
}

interface TextField extends TinaBaseField {
  type: "text";
}

interface NumberField extends TinaBaseField {
  type: "number";
}

interface TextareaField extends TinaBaseField {
  type: "textarea";
}

interface SelectField extends TinaBaseField {
  type: "select";
  options: string[]; // NOTE this is possibly an object in Tina's case
}

interface ImageField extends TinaBaseField {
  type: "image";
}

interface GroupField extends TinaBaseField {
  type: "group";
  fields: TinaField[];
}

interface GroupListField extends TinaBaseField {
  type: "group-list";
  fields: TinaField[];
}

interface ListField extends TinaBaseField {
  type: "list";
  field: {
    component: "text" | "textarea" | "number" | "select";
  };
}
interface ToggleField extends TinaBaseField {
  type: "toggle";
}

interface TagsField extends TinaBaseField {
  type: "tags";
}

interface BlocksField extends TinaBaseField {
  type: "blocks";
  templates: TinaCloudTemplate[];
}

interface Reference extends TinaBaseField {
  type: "reference";
  section: string;
}

interface ReferenceList extends TinaBaseField {
  type: "reference-list";
  section: string;
}
