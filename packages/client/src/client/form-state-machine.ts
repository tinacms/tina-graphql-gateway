import {
  createMachine,
  Machine,
  assign,
  sendParent,
  interpret,
  send,
} from "xstate";
import { Form, TinaCMS } from "tinacms";
import type { ForestryClient } from "../client";
import * as yup from "yup";
import { isContext } from "vm";

interface NodeFormContext {
  queryFieldName: string;
  node: NodeType;
  cms: TinaCMS;
  client: ForestryClient;
  coldFields: { name: string; refetchPolicy?: null | "onChange" };
  form: null | Form;
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
        form: null;
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
        form: Form;
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
        form: null | Form;
        error: string;
      };
    };

interface NodeType {
  sys: object;
  data: object;
  form: object;
  values: object;
}

// const tinaFormMachine = Machine({
//   id: 'tina-form-machine',
//   initial: 'waitingForCode',
//   states: {
//     waitingForCode: {
//       on: {
//         CODE: {
//           actions: respond('TOKEN', { delay: 1000 })
//         }
//       }
//     }
//   }
// });

const tinaFormMachine = Machine({
  id: "tina-form",
  initial: "active",
  states: {
    active: {
      entry: sendParent("PONG", {
        delay: 1000,
      }),
      on: {
        PING: {
          // Sends 'PONG' event to parent machine
          actions: sendParent("PONG", {
            delay: 1000,
          }),
        },
      },
    },
  },
});

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
      initial: "idle",
      states: {
        idle: {
          invoke: {
            src: "createForm",
            onDone: {
              target: "ready",
              actions: assign({ form: (context, event) => event.data }),
            },
            onError: {
              target: "failure",
              actions: assign({ error: (context, event) => event.data }),
            },
          },
        },
        loading: {},
        ready: {
          invoke: {
            id: id + "_tinaForm",
            src: tinaFormMachine,
          },
          on: {
            PONG: {
              actions: send("PING", {
                to: id + "_tinaForm",
                delay: 1000,
              }),
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
        form: null,
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
    .onTransition((state) => console.log(state))
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
