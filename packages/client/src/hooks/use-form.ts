import React from "react";
import { useCMS, TinaCMS } from "tinacms";
import { createFormMachine } from "./form-service";
import { createMachine, spawn, StateSchema, assign } from "xstate";
import { useMachine } from "@xstate/react";
import { ContentCreatorPlugin, OnNewDocument } from "./create-page-plugin";
import set from "lodash.set";
import has from "lodash.has";
import * as yup from "yup";

interface FormsMachineSchemaType extends StateSchema {
  states: {
    initializing;
    inactive;
    active;
  };
}

export type toggleMachineStateValue = keyof FormsMachineSchemaType["states"];

type FormsState =
  | {
      value: "inactive";
      context: FormsContext;
    }
  | {
      value: "active";
      context: FormsContext;
    };

type FormsEvent =
  | {
      type: "RETRY";
      value: { payload: object; queryString: string };
    }
  | {
      type: "FORM_VALUE_CHANGE";
      pathAndValue: any;
    };

interface FormsContext {
  payload: object;
  formRefs: object;
  cms: TinaCMS;
  queryString: string;
  onSubmit?: (args: { mutationString: string; variables: object }) => void;
}

const formsMachine = createMachine<FormsContext, FormsEvent, FormsState>({
  id: "forms",
  initial: "initializing",
  states: {
    inactive: {
      on: {
        RETRY: {
          target: "initializing",
          actions: assign({
            payload: (context, event) => {
              return event.value.payload;
            },
            queryString: (context, event) => {
              return event.value.queryString;
            },
          }),
        },
      },
    },
    initializing: {
      invoke: {
        src: async (context, event) => {
          const payloadSchema = yup.object().required();

          const accum = {};

          const pl = await payloadSchema.validate(context.payload);

          const keys = Object.keys(pl);
          await Promise.all(
            Object.values(pl).map(async (payloadItem, index) => {
              // validate payload
              let dataSchema = yup.object().shape({
                // @ts-ignore
                form: yup.object().required().shape({
                  // @ts-ignore
                  label: yup.string().required(),
                  // @ts-ignore
                  name: yup.string().required(),
                }),
              });

              try {
                const item = await dataSchema.validate(payloadItem);
                accum[keys[index]] = item;
              } catch (e) {}

              return true;
            })
          );

          if (Object.keys(accum).length === 0) {
            throw new Error("No queries could be used as a Tina form");
          }

          return accum;
        },
        onDone: {
          target: "active",
          actions: assign({
            formRefs: (context, event) => {
              const accum = {};
              const keys = Object.keys(event.data);
              Object.values(event.data).forEach((item, index) => {
                accum[keys[index]] = spawn(
                  createFormMachine({
                    client: context.cms.api.tina,
                    cms: context.cms,
                    // @ts-ignore
                    node: item,
                    onSubmit: context.onSubmit,
                    queryFieldName: keys[index],
                    queryString: context.queryString,
                  }),
                  `form-${keys[index]}`
                );
              });
              return accum;
            },
          }),
        },
        onError: {
          target: "inactive",
        },
      },
    },
    active: {
      // entry: (context) => console.log("ctx", context.formRefs),
      on: {
        // RETRY: {
        //   target: "initializing",
        //   actions: assign({
        //     payload: (context, event) => {
        //       return event.value.payload;
        //     },
        //     queryString: (context, event) => {
        //       return event.value.queryString;
        //     },
        //     formRefs: (context, event) => ({}),
        //   }),
        // },
        FORM_VALUE_CHANGE: {
          actions: assign({
            payload: (context, event) => {
              // FIXME: this is pretty heavy-handed, ideally we have a better way of only updating parts of the payload that changed
              const temp = { ...context.payload };
              const hasQueriedKey = has(temp, event.pathAndValue.path);
              // If we didn't query for it, don't populate it
              if (hasQueriedKey) {
                set(temp, event.pathAndValue.path, event.pathAndValue.value);
              }
              return temp;
            },
          }),
        },
      },
    },
  },
});

export function useForm<T>({
  payload,
  onSubmit,
  onNewDocument,
}: {
  payload: object;
  onSubmit?: (args: { queryString: string; variables: object }) => void;
  onNewDocument?: OnNewDocument;
}): T {
  // @ts-ignore FIXME: need to ensure the payload has been hydrated with Tina-specific stuff
  const queryString = payload._queryString;
  const cms = useCMS();

  React.useEffect(() => {
    const run = async () => {
      const res = await cms.api.tina.request(
        (gql) => gql`
          {
            getSections {
              slug
              templates
            }
          }
        `,
        { variables: {} }
      );
      const options = [];
      res.getSections.forEach((section) => {
        section.templates.map((template) => {
          const optionValue = `${section.slug}.${template}`;
          const optionLabel = `Section: ${section.slug} - Template: ${template}`;
          options.push({ value: optionValue, label: optionLabel });
        });
      });
      cms.plugins.add(
        new ContentCreatorPlugin({
          onNewDocument: onNewDocument,
          fields: [
            {
              component: "select",
              name: "sectionTemplate",
              label: "Template",
              description: "Select the section & template",
              options: [
                {
                  value: "",
                  label: "",
                },
                ...options,
              ],
            },
            {
              component: "text",
              name: "relativePath",
              label: "Relative Path",
              description:
                'The path relative to the given section. Example: "my-blog-post.md"',
              placeholder: "...",
            },
          ],
          label: "Add Document",
        })
      );
    };

    run();
  }, [cms]);

  const [current, send] = useMachine(formsMachine, {
    context: {
      payload,
      formRefs: {},
      cms,
      queryString,
      onSubmit: (values) => {
        cms.api.tina.prepareVariables(values).then((variables) => {
          onSubmit
            ? onSubmit({
                queryString: values.mutationString,
                variables,
              })
            : cms.api.tina
                .request(values.mutationString, { variables })
                .then((res) => {
                  // console.log("res", res);
                });
        });
      },
    },
  });

  React.useEffect(() => {
    send({ type: "RETRY", value: { payload, queryString } });
  }, [JSON.stringify(payload), queryString]);

  // @ts-ignore
  return current.context.payload;
}

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
