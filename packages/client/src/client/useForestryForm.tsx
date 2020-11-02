import React from "react";
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
    };
    relativePath: string;
    section: string;
  },
  options = { onSubmit: null }
): T {
  const [documentData, setDocumentData] = React.useState(props.document);
  const cms = useCMS();

  const { __typename, form, data, initialValues } = props.document.node;

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
            await cms.api.forestry.updateContent({
              relativePath: props.relativePath,
              section: props.section,
              payload: values,
              form: form,
            });

            const d = await cms.api.forestry.request(props.query, {
              variables: {
                relativePath: props.relativePath,
                section: props.section,
              },
            });
            console.log(d);
            setDocumentData(d.document);
          },
  });

  const [createPagePlugin, setCreatePagePlugin] = React.useState(
    new ContentCreatorPlugin({
      label: `Add ${props.section}`,
      fields: [
        {
          name: "filename",
          label: "filename",
          component: "text",
          description: "This can be a pathname relative to your section config",
          required: true,
        },
      ],
      section: props.section,
    })
  );
  React.useEffect(() => {
    const getSectionData = async () => {
      const sectionData = await cms.api.forestry.request(
        `
        query SectionQuery($section: String!) {
          getSection(section: $section) {
            type
            path
            templates
            create
          }
        }
      `,
        {
          variables: { section: props.section },
        }
      );
      const s = sectionData.getSection;
      const createPagePlugin = new ContentCreatorPlugin({
        label: `Add ${props.section}`,
        fields: [
          {
            name: "filename",
            label: "Filename",
            component: "text",
            description: `The value after your section directory - ${s.path}`,
            required: true,
          },
          {
            name: "template",
            label: "Template",
            component: "select",
            // FIXME: this shouldn't require selection but it
            // does because we aren't able to add initial values
            options: ["", ...s.templates],
            required: true,
          },
        ],
        section: props.section,
      });
      setCreatePagePlugin(createPagePlugin);
    };

    getSectionData();
  }, [props.section]);

  usePlugin(createPagePlugin);
  usePlugin(tinaForm);

  // console.log(documentData.node);
  return documentData.node;
  // @ts-ignore
  return props.document.node as T;
}
