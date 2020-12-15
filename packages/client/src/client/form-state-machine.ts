import {
  createMachine,
  Machine,
  assign,
  sendParent,
  interpret,
  send,
  spawn,
  SpawnedActorRef,
} from "xstate";
import { splitDataNode } from "@forestryio/graphql-helpers";
import { Form, TinaCMS } from "tinacms";
import type { ForestryClient } from "../client";
import { fieldSubscriptionItems } from "final-form";

interface NodeFormContext {
  queryFieldName: string;
  queryString: string;
  node: NodeType;
  cms: TinaCMS;
  client: ForestryClient;
  coldFields: { name: string; refetchPolicy?: null | "onChange" };
  formRef: null | SpawnedActorRef<any, any>;
  modifiedValues: object;
  error: null | string;
}

type NodeFormEvent =
  | { type: "FETCH"; id: string }
  | { type: "PING" }
  | { type: "PONG" }
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
        node: NodeType;
        cms: TinaCMS;
        client: ForestryClient;
        coldFields: { name: string; refetchPolicy?: null | "onChange" };
        modifiedValues: object;
        formRef: SpawnedActorRef<any, any>;
        error: null;
      };
    }
  | {
      value: "ready";
      context: {
        queryFieldName: string;
        queryString: string;
        node: NodeType;
        cms: TinaCMS;
        client: ForestryClient;
        coldFields: { name: string; refetchPolicy?: null | "onChange" };
        modifiedValues: object;
        formRef: SpawnedActorRef<any, any>;
        error: null;
      };
    }
  | {
      value: "failure";
      context: {
        queryFieldName: string;
        queryString: string;
        node: NodeType;
        cms: TinaCMS;
        client: ForestryClient;
        coldFields: { name: string; refetchPolicy?: null | "onChange" };
        modifiedValues: object;
        formRef: null | SpawnedActorRef<any, any>;
        error: string;
      };
    };

interface NodeType {
  sys: object;
  data: object;
  form: object;
  values: object;
}

const buildFields = ({
  parentPath,
  form,
  context,
  callback,
}: {
  parentPath: string[];
  form: Pick<NodeType, "form">;
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
            type: "PONG",
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
                  type: "PONG",
                  values: {
                    path: [...parentPath, ...name.split(".")],
                    value: Object.values(res)[0],
                  },
                });
              });
          } else {
            callback({
              type: "PONG",
              values: {
                path: [...parentPath, ...name.split(".")],
                value,
              },
            });
          }
        } else {
          callback({
            type: "PONG",
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
    node: NodeType;
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
            PONG: {
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
        modifiedValues: initialContext.node.values,
        // @ts-ignore
        coldFields: initialContext.node.form.fields.filter((field) => {
          return field.refetchPolicy === "onChange";
        }),
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
        evaluateColdFields: async () => {
          // console.log;
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
