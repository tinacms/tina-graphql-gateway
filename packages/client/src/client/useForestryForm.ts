import { useCMS, useForm, Form, FormOptions, usePlugin } from "tinacms";

export function useForestryForm(
  document: any,
  options = { onSubmit: null }
): any {
  const cms = useCMS();

  const { __typename, path, form, data, initialValues } = document;

  const [modifiedValues, tinaForm] = useForm({
    id: "tina-tutorial-index",
    label: "Edit Page",
    fields: form.fields.map((field) => {
      if (field.component === "image") {
        return {
          ...field,
          parse: (media) => {
            return media.filename;
          },
          uploadDir: () => "/public/",
          previewSrc: (fullSrc) => {
            return `/uploads/${fullSrc}`;
          },
        };
      }
      return field;
    }),
    initialValues: initialValues,
    onSubmit:
      options && options?.onSubmit
        ? async (values) => {
            const payload = await cms.api.forestry.transformPayload({
              path: path,
              payload: values,
              form: form,
            });
            options.onSubmit(values, payload);
          }
        : async (values) => {
            cms.api.forestry.updateContent({
              path: path,
              payload: values,
              form: form,
            });
          },
  });

  usePlugin(tinaForm);

  return {
    __typename,
    data: modifiedValues, // TODO - should we be returning more than just data here?
  };
}
