import { useCMS, useForm, Form, FormOptions } from "tinacms";

export function useForestryForm(
  document: any,
  customFormConfig: Partial<FormOptions<any>> = {},
  customFields: any = {}
): any {
  const cms = useCMS();

  const { __typename, path, form, data, initialValues } = document;

  const [modifiedValues, tinaForm] = useForm({
    id: "tina-tutorial-index",
    label: "Edit Page",
    fields: form.fields.map((field) => {
      if (field.component === "image") {
        console.log(field);
        return {
          ...field,
          parse: (media) => `/static/${media.filename}`,
          uploadDir: () => "/public/static/",
          previewSrc: (fullSrc) => {
            console.log("hii", fullSrc);
            return `public/${fullSrc}`;
          },
        };
      }
      return field;
    }),
    initialValues: initialValues,
    onSubmit: async (values) => {
      cms.api.forestry.updateContent({
        path: path,
        payload: values,
        form: form,
      });
    },
  });

  return [
    {
      __typename,
      data: modifiedValues, // TODO - should we be returning more than just data here?
    },
    tinaForm as any, //hack - seems to be a dependency issue with duplicate @tinacms/form Form types
  ];
}
