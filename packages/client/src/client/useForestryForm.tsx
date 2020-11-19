import React from "react";
import { useCMS, useForm, usePlugin } from "tinacms";
import { ContentCreatorPlugin } from "./create-page-plugin";

export function useForestryForm2<T>({
  props,
  variables,
  fetcher,
}: {
  props: {
    document: {
      node: {
        __typename: string;
        form: { fields: any[] };
        data: object;
        initialValues: object;
      };
    };
  };
  variables: { relativePath: string; section: string };
  fetcher: <T>() => Promise<T>;
}): { modifiedValues: object; data: T } {
  const cms = useCMS();

  const { data, form, initialValues } = props.document.node;
  const [serverData, setServerData] = React.useState(data);

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
    onSubmit: async (values) => {
      await submit(values);
    },
  });

  const submit = async (values) => {
    // TODO: this should specify the response data
    // so we don't need another round trip
    await cms.api.forestry.updateContent({
      relativePath: variables.relativePath,
      section: variables.section,
      payload: values,
      form: form,
    });
    const updatedContent = await fetcher();
    // @ts-ignore
    setServerData(updatedContent.document.node.data);
  };

  const hotFields = form.fields.filter((field) => {
    return field.refetchPolicy !== "onChange";
  });

  const hotFieldsMap = {};
  hotFields.forEach((field) => {
    hotFieldsMap[field.name] = modifiedValues[field.name];
  });

  const coldFields = form.fields.filter((field) => {
    return field.refetchPolicy === "onChange";
  });

  const coldValues = coldFields.map((field) => {
    return modifiedValues[field.name];
  });

  React.useEffect(() => {
    const doit = async () => {
      await submit(modifiedValues);
    };

    doit();
  }, coldValues);

  useCreateDocumentPlugin(variables.section);
  usePlugin(tinaForm);

  const realData = tempRemoveFormKeys(serverData);

  return {
    modifiedValues,
    data: Object.assign(realData, hotFieldsMap) as T,
  };
}

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
    query: string;
    relativePath: string;
    section: string;
  },
  options = { onSubmit: null }
): { modifiedValues: object; data: object } {
  const cms = useCMS();

  const { data, form, initialValues } = props.document.node;
  const [serverData, setServerData] = React.useState(data);

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
    onSubmit: async (values) => {
      if (options.onSubmit) {
        const payload = await cms.api.forestry.transformPayload({
          payload: values,
          form: form,
        });
        options.onSubmit(values, payload);
      } else {
        // TODO: this should specify the response data
        // so we don't need another round trip
        await cms.api.forestry.updateContent({
          relativePath: props.relativePath,
          section: props.section,
          payload: values,
          form: form,
        });
        const updatedContent = await cms.api.forestry.request(props.query, {
          variables: {
            relativePath: props.relativePath,
            section: props.section,
          },
        });
        setServerData(updatedContent.document.node.data);
      }
    },
  });

  const hotFields = form.fields.filter((field) => {
    return field.refetchPolicy !== "onChange";
  });

  const hotFieldsMap = {};
  hotFields.forEach((field) => {
    hotFieldsMap[field.name] = modifiedValues[field.name];
  });

  const coldFields = form.fields.filter((field) => {
    return field.refetchPolicy === "onChange";
  });

  const coldValues = coldFields.map((field) => {
    return modifiedValues[field.name];
  });

  React.useEffect(() => {
    const doit = async () => {
      await cms.api.forestry.updateContent({
        relativePath: props.relativePath,
        section: props.section,
        payload: modifiedValues,
        form: form,
      });
      const updatedContent = await cms.api.forestry.request(props.query, {
        variables: {
          relativePath: props.relativePath,
          section: props.section,
        },
      });
      setServerData(updatedContent.document.node.data);
    };

    doit();
  }, coldValues);

  useCreateDocumentPlugin(props.section);
  usePlugin(tinaForm);

  const realData = tempRemoveFormKeys(serverData);

  return {
    modifiedValues,
    data: Object.assign(realData, hotFieldsMap),
  };
}

/**
 *
 * Right now our form builder puts form keys inside the nested documents,
 * we want to hoist those up or omit them, but for now this is easiest
 */
const tempRemoveFormKeys = (data: object) => {
  const accum = {};
  Object.keys(data)
    .filter((key) => {
      return key !== "form" && key !== "initialValues";
    })
    .forEach((key) => {
      if (Array.isArray(data[key])) {
        accum[key] = data[key].map((value) => {
          if (typeof value === "object" && value !== null) {
            return tempRemoveFormKeys(value);
          } else {
            return value;
          }
        });
      } else if (typeof data[key] === "object" && data[key] !== null) {
        accum[key] = tempRemoveFormKeys(data[key]);
      } else {
        accum[key] = data[key];
      }
    });

  return accum;
};

const useCreateDocumentPlugin = (section: string) => {
  const cms = useCMS();
  const [createPagePlugin, setCreatePagePlugin] = React.useState(
    new ContentCreatorPlugin({
      label: `Add ${section}`,
      fields: [
        {
          name: "filename",
          label: "filename",
          component: "text",
          description: "This can be a pathname relative to your section config",
          required: true,
        },
      ],
      section,
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
          variables: { section },
        }
      );
      const s = sectionData.getSection;
      const createPagePlugin = new ContentCreatorPlugin({
        label: `Add ${section}`,
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
        section,
      });
      setCreatePagePlugin(createPagePlugin);
    };

    getSectionData();
  }, [section]);

  usePlugin(createPagePlugin);
};
