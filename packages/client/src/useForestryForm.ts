import { useCMS, useForm, Form } from "tinacms";

export const useForestryForm = <FormShape = any>(
  data,
  customizations = {}
): [{ data: FormShape; __typename: string }, Form] => {
  const cms = useCMS();

  const { path } = data.document;
  const formConfig = {
    id: path,
    label: path,
    initialValues: data.document.data,
    fields: data.document.form.fields,
  };

  formConfig.fields = traverse(formConfig.fields, customizations);
  const [formData, form] = useForm<FormShape>({
    ...formConfig,
    onSubmit: (values) => {
      cms.api.forestry.updateContent({
        path: formConfig.id,
        payload: values,
      });
    },
  });

  const { __typename } = data.document;

  return [
    {
      __typename,
      data: formData,
    },
    form as any, //hack - seems to be a dependency issue with duplicate @tinacms/form Form types
  ];
};

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
