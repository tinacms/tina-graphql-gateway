import React from "react";
import { useCMS, usePlugin } from "tinacms";
import { createFormService } from "./form-state-machine";
import { ContentCreatorPlugin } from "./create-page-plugin";
import set from "lodash.set";
import * as yup from "yup";

export function useForestryForm({
  payload,
  queryString,
  onChange,
}: {
  payload: object;
  queryString: string;
  onChange?: (payload: object) => void;
}): { data: object } {
  const cms = useCMS();
  const [data, setData] = React.useState({});

  useCreateDocumentPlugin("posts");

  const payloadSchema = yup.object().required();
  const nodeSchema = yup
    .object()
    .shape({
      sys: yup.object().required().shape({
        // @ts-ignore
        filename: yup.string().required(),
        // @ts-ignore
        basename: yup.string().required(),
      }),
      form: yup.object().required().shape({
        // @ts-ignore
        __typename: yup.string().required(),
        // @ts-ignore
        name: yup.string().required(),
        // @ts-ignore
        label: yup.string().required(),
      }),
      values: yup.object().required(),
    })
    .required();

  const keys = Object.keys(payload);
  React.useEffect(() => {
    payloadSchema
      .validate(payload)
      .then(() => {
        Object.values(payload).map((maybeNode, index) => {
          nodeSchema.validate(maybeNode).then(() => {
            setData(payload);

            createFormService(
              {
                queryFieldName: keys[index],
                queryString: queryString,
                node: maybeNode,
                client: cms.api.forestry,
                cms: cms,
              },
              (data) => {
                set(payload, data.path, data.value);
                setData(payload);
                onChange(payload);
              }
            );
          });
        });
      })
      .catch(function (err) {
        // console.warn(err.errors);
      });
  }, [payload]);

  return { data };
}

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

type Field = {
  __typename: string;
  name: string;
  label: string;
  component: string;
};

export type DocumentNode = {
  // id: string;
  sys: {
    filename: string;
    relativePath: string;
    basename: string;
    path: string;
  };
  form: {
    __typename: string;
    fields: Field[];
    label: string;
    name: string;
  };
  values: {
    [key: string]: string | string[] | object | object[];
  };
  data: {
    [key: string]: string | string[] | object | object[];
  };
};
