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
import { Form, TinaCMS } from "tinacms";
import type { ForestryClient } from "../client";
import * as yup from "yup";

interface NodeFormContext {
  queryFieldName: string;
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

  form.subscribe(
    (values) => {
      callback({ type: "PONG", values });
    },
    { values: true }
  );

  return () => context.cms.plugins.remove(form);
};

export const createFormService = (initialContext: {
  queryFieldName: string;
  node: NodeType;
  client: ForestryClient;
  cms: TinaCMS;
}) => {
  const id = initialContext.queryFieldName + "_NodeFormMachine";
  const formMachine = createMachine<
    NodeFormContext,
    NodeFormEvent,
    NodeFormState
  >(
    {
      id,
      initial: "ready",
      states: {
        loading: {},
        ready: {
          entry: assign({
            formRef: (context) => spawn(formCallback(context)),
          }),
          on: {
            PONG: {
              actions: (context, event) => {
                console.log("PONG", event);
              },
            },
          },
        },
        failure: {},
      },
      context: {
        queryFieldName: initialContext.queryFieldName,
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
    .onTransition((state) => console.log(state.value))
    .onEvent((event) => {
      console.log("event received", event.type);
    })
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
