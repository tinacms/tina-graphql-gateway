import { useCMS, useForm, Form, FormOptions } from "tinacms";

type BaseDataShape = {
  document?: any;
};

type BaseFormShape = { data: any; __typename: string };

export function useForestryForm<
  DataShape extends BaseDataShape = any,
  FormShape extends BaseFormShape = any
>(
  data: DataShape,
  customFormConfig: Partial<FormOptions<any>>,
  customFields: any = {}
): [FormShape, Form] {
  const cms = useCMS();

  const { path } = data.document!;
  const formConfig = {
    id: path,
    label: path,
    initialValues: data.document!.data,
    fields: data.document!.form.fields,
    onSubmit: (values) => {
      cms.api.forestry.updateContent({
        path: path,
        payload: values,
      });
    },
    ...customFormConfig,
  };

  formConfig.fields = traverse(formConfig.fields, customFields);
  const [formData, form] = useForm(formConfig);

  const { __typename } = data.document!;

  return [
    {
      __typename,
      data: formData, // TODO - should we be returning more than just data here?
    } as FormShape,
    form as any, //hack - seems to be a dependency issue with duplicate @tinacms/form Form types
  ];
}

const traverse = (fields, customizations) => {
  const customizeComponentNames = Object.keys(customizations);
  return fields.map((field) => {
    // If is group or group-list
    if (field.hasOwnProperty("fields")) {
      return {
        ...field,
        fields: traverse(field.fields, customizations),
      };
    }
    // If is blocks
    if (field.hasOwnProperty("templates")) {
      const templates2: { [key: string]: any } = {};
      Object.keys(field.templates).forEach((templateKey) => {
        templates2[templateKey] = {
          ...field.templates[templateKey],
          fields: traverse(field.templates[templateKey].fields, customizations),
        };
      });
      return {
        ...field,
        templates: templates2,
      };
    }

    if (field.component === "toggle") {
      return {
        ...field,
        // parse: (value: any, name: string, field: any) => {
        //   console.log("parse", name, value);
        //   return value;
        // },
        // format: (value: any, name: string, field: any) => {
        //   console.log("format", name, value);
        //   return value;
        // },
      };
    }

    if (customizeComponentNames.includes(field.component)) {
      return {
        ...customizations[field.component](field),
      };
    }

    return field;
  });
};
