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

const formCallback = (context) => (callback, receive) => {
  const keys = Object.keys(context.node.data);
  const fields = Object.values(context.node.data)
    .map((value, index) => {
      const key = keys[index];
      const field = context.node.form.fields.find((f) => f.name === key);
      // items like __typename don't have a corresponding field
      const path = [context.queryFieldName, "data", key];
      if (field) {
        if (
          field.component === "select" &&
          field.refetchPolicy === "onChange"
        ) {
          const query = context.queries[path.join("-")].query;
          if (query) {
            field.onSelect = async (value) => {
              const res = await context.client.request(query, {
                variables: {
                  relativePath: value,
                },
              });
              return res;
            };
          }
        }
        return {
          ...field,
          parse: (value, name) => {
            field.onSelect && field.onSelect(value);
            if (field.onSelect) {
              field.onSelect(value).then((res) => {
                callback({
                  type: "PONG",
                  values: { path: path, value: res.getAuthorsDocument },
                });
              });
              return value;
            } else {
              callback({ type: "PONG", values: { path: path, value } });
              return value;
            }
          },
        };
      } else {
        return false;
      }
    })
    .filter(Boolean);

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
          console.log;
        },
      },
    }
  );

  // const service2 = interpret(pingMachine)
  //   .onTransition((state) => console.log(state.value))
  //   .start();

  const service = interpret(formMachine)
    // .onTransition((state) => console.log(state.value))
    // .onEvent((event) => {
    //   console.log("event received", event.type);
    // })
    .start();

  // service.subscribe((state) => {
  //   console.log(state.value);
  //   console.log(state.nextEvents);
  // });

  return service;
};

// // Invoked child machine
// const pongMachine = Machine({
//   id: "pong",
//   initial: "active",
//   states: {
//     active: {
//       on: {
//         PING: {
//           // Sends 'PONG' event to parent machine
//           actions: sendParent("PONG", {
//             delay: 1000
//           })
//         }
//       }
//     }
//   }
// });
