import {
  createMachine,
  assign,
  interpret,
  spawn,
  SpawnedActorRef,
} from "xstate";
import { splitDataNode } from "@forestryio/graphql-helpers";
import { Form, TinaCMS } from "tinacms";
import type { ForestryClient } from "../client";
import type { DocumentNode } from "./useForestryForm";

interface NodeFormContext {
  queryFieldName: string;
  queryString: string;
  node: DocumentNode;
  cms: TinaCMS;
  client: ForestryClient;
  formRef: null | SpawnedActorRef<any, any>;
  queries: { [key: string]: string };
  error: null | string;
}

type NodeFormEvent =
  | { type: "FETCH"; id: string }
  | { type: "PING" }
  | {
      type: "ON_FIELD_CHANGE";
      values: { path: (string | number)[]; value: unknown };
    }
  | { type: "RESOLVE"; form: Form }
  | { type: "UPDATE_VALUES"; values: object }
  | { type: "REJECT"; error: string };

type NodeFormState =
  | {
      value: "idle";
      context: NodeFormContext;
    }
  | {
      value: "loading";
      context: {
        queryFieldName: string;
        queryString: string;
        node: DocumentNode;
        cms: TinaCMS;
        client: ForestryClient;
        formRef: SpawnedActorRef<any, any>;
        error: null;
      };
    }
  | {
      value: "ready";
      context: {
        queryFieldName: string;
        queryString: string;
        node: DocumentNode;
        cms: TinaCMS;
        client: ForestryClient;
        formRef: SpawnedActorRef<any, any>;
        error: null;
      };
    }
  | {
      value: "failure";
      context: {
        queryFieldName: string;
        queryString: string;
        node: DocumentNode;
        cms: TinaCMS;
        client: ForestryClient;
        formRef: null | SpawnedActorRef<any, any>;
        error: string;
      };
    };

const buildFields = ({
  parentPath,
  form,
  context,
  callback,
}: {
  parentPath: string[];
  form: Pick<DocumentNode, "form">;
  context: NodeFormContext;
  callback: (args: NodeFormEvent) => void;
}) => {
  return form.fields.map((field) => {
    if (field.fields) {
      field.fields = field.fields = buildFields({
        parentPath: parentPath,
        form: field,
        context,
        callback,
      });
    }
    if (field.component === "list") {
      field.field = {
        ...field.field,
        parse: (value, name) => {
          callback({
            type: "ON_FIELD_CHANGE",
            values: {
              path: [...parentPath, ...name.split(".")],
              value,
            },
          });
          return value;
        },
      };
    }

    if (field.templates) {
      const templateKeys = Object.keys(field.templates);
      Object.values(field.templates).map((template, index) => {
        field.templates[templateKeys[index]].fields = buildFields({
          parentPath,
          context,
          form: template,
          callback,
        });
      });
    }

    return {
      ...field,
      parse: (value, name) => {
        if (field.component === "select") {
          // Remove indexes in path, ex. "data.0.blocks.2.author" -> "data.blocks.author"
          const queryPath = [...parentPath, ...name.split(".")]
            .filter((item) => {
              return isNaN(parseInt(item));
            })
            .join(".");

          if (context.queries[queryPath]) {
            context.client
              .request(context.queries[queryPath], {
                variables: {
                  relativePath: value,
                },
              })
              .then((res) => {
                callback({
                  type: "ON_FIELD_CHANGE",
                  values: {
                    path: [...parentPath, ...name.split(".")],
                    value: Object.values(res)[0],
                  },
                });
              });
          } else {
            callback({
              type: "ON_FIELD_CHANGE",
              values: {
                path: [...parentPath, ...name.split(".")],
                value,
              },
            });
          }
        } else {
          callback({
            type: "ON_FIELD_CHANGE",
            values: {
              path: [...parentPath, ...name.split(".")],
              value,
            },
          });
        }
        return value;
      },
    };
  });
};

const formCallback = (context) => (callback, receive) => {
  const path = [context.queryFieldName, "data"];
  const fields = buildFields({
    parentPath: path,
    context,
    callback,
    ...context.node,
  });

  const form = new Form({
    id: context.queryFieldName,
    // @ts-ignore
    label: `${context.node.sys.basename}`,
    fields,
    initialValues: context.node.values,
    onSubmit: async (values) => {
      console.log("submit it", values);
    },
  });

  context.cms.plugins.add(form);

  return () => context.cms.plugins.remove(form);
};

export const createFormService = (
  initialContext: {
    queryFieldName: string;
    queryString: string;
    node: DocumentNode;
    client: ForestryClient;
    cms: TinaCMS;
  },
  onChange
) => {
  const id = initialContext.queryFieldName + "_NodeFormMachine";
  const formMachine = createMachine<
    NodeFormContext,
    NodeFormEvent,
    NodeFormState
  >(
    {
      id,
      initial: "loading",
      states: {
        loading: {
          invoke: {
            id: id + "breakdownData",
            src: "breakdownData",
            onDone: "assigningQueries",
            onError: "failure",
          },
        },
        assigningQueries: {
          entry: assign({
            queries: (context, event) => {
              return event.data;
            },
          }),
          on: {
            "": "ready",
          },
        },
        ready: {
          entry: assign({
            formRef: (context) => spawn(formCallback(context)),
          }),
          on: {
            ON_FIELD_CHANGE: {
              actions: (context, event) => {
                onChange(event.values);
              },
            },
          },
        },
        failure: {},
      },
      context: {
        queryFieldName: initialContext.queryFieldName,
        queryString: initialContext.queryString,
        node: initialContext.node,
        cms: initialContext.cms,
        client: initialContext.client,
        error: null,
        formRef: null,
      },
    },
    {
      services: {
        breakdownData: async (context, event) => {
          return splitDataNode({
            queryFieldName: context.queryFieldName,
            queryString: context.queryString,
            node: context.node,
            schema: await context.client.getSchema(),
          });
        },
        createForm: async (context, event) => {
          const form = new Form({
            id: context.queryFieldName,
            // @ts-ignore
            label: `${context.node.sys.basename}`,
            // @ts-ignore
            fields: context.node.form.fields,
            initialValues: context.node.values,
            onSubmit: async (values) => {
              console.log("submit it", values);
            },
          });
          context.cms.plugins.add(form);

          // return form.unsubscribe() // Should support this
          return form;
        },
      },
    }
  );

  const service = interpret(formMachine)
    // .onTransition((state) => console.log(state.value))
    // .onEvent((event) => {
    //   console.log("event received", event.type);
    // })
    .start();

  return service;
};
