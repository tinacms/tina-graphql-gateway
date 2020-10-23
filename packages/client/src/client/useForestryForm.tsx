import { useCMS, useForm, usePlugin } from "tinacms";
import { ContentCreatorPlugin } from "./create-page-plugin";

export function useForestryForm<T>(
  props: {
    document: {
      node: {
        __typename: string;
        form: { fields: any[] };
        data: object;
        initialValues: object;
      };
      relativePath: string;
      section: string;
    };
  },
  options = { onSubmit: null }
): T {
  const cms = useCMS();

  const { __typename, form, initialValues } = props.document.node;

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
              payload: values,
              form: form,
            });
            options.onSubmit(values, payload);
          }
        : async (values) => {
            cms.api.forestry.updateContent({
              // @ts-ignore
              relativePath: props.relativePath,
              // @ts-ignore
              section: props.section,
              payload: values,
              form: form,
            });
          },
  });

  const createPagePlugin = new ContentCreatorPlugin({
    label: "Add Page",
    fields: [
      { name: "title", label: "Title", component: "text", required: true },
    ],
    filename: ({ title }) => {
      return `content/posts/${title.replace(/\s+/, "-").toLowerCase()}.md`;
    },
    body: () => ``,
    frontmatter: ({ title }) => {
      //remove any other dirs from the title, return only filename
      const id = `/posts/${title.replace(/\s+/, "-").toLowerCase()}`;
      return {
        title,
        id,
        prev: null,
        next: null,
      };
    },
  });

  usePlugin(createPagePlugin);
  usePlugin(tinaForm);

  // @ts-ignore
  return {
    __typename,
    data: modifiedValues,
  } as T;
}
