/**
Copyright 2021 Forestry.io Inc
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from "react";
import GraphiQL from "graphiql";
import { formBuilder } from "@forestryio/graphql-helpers";
import { useMachine } from "@xstate/react";
import { Machine, assign, createMachine, StateSchema } from "xstate";
import { useForm } from "tina-graphql-gateway";
import { Form, useCMS, TinaCMS } from "tinacms";
import { Sidebar } from "./sidebar";
import {
  parse,
  getIntrospectionQuery,
  GraphQLSchema,
  buildClientSchema,
  print,
} from "graphql";

interface GraphiQLStateSchema extends StateSchema {
  states: {
    project: {
      states: {
        initializing: {};
        fetchingSchema: {};
        generatingQuery: {};
        ready: {};
        formifyingQuery: {};
      };
    };
  };
}

// The events that the machine handles
type GraphiQLEvent =
  | { type: "FETCH" }
  | { type: "FORMIFY" }
  | { type: "RESET" }
  | { type: "EDIT_QUERY"; value: string }
  | { type: "EDIT_RESULT"; value: object }
  | {
      type: "CHANGE_RELATIVE_PATH";
      value: { variables: { relativePath: string }; section: string };
    }
  | { type: "EDIT_VARIABLES"; value: object }
  | { type: "SETUP_MUTATION"; value: object }
  | {
      type: "CHANGE_SECTION";
      value: string;
    };

interface GraphiQLContext {
  cms: TinaCMS;
  variables: object;
  schema: null | GraphQLSchema;
  result: object;
  queryString: string;
  section: string;
  relativePath: string;
}
type GraphiQLState = { value: "project"; context: GraphiQLContext };

// This machine is completely decoupled from React
export const graphiqlMachine = createMachine<
  GraphiQLContext,
  GraphiQLEvent,
  GraphiQLState
>({
  id: "graphiql",
  initial: "project",
  states: {
    project: {
      initial: "initializing",
      states: {
        initializing: {
          invoke: {
            id: "fetchSchema",
            src: async (context) => {
              const data = await context.cms.api.tina.request(
                getIntrospectionQuery(),
                {
                  variables: {},
                }
              );

              return data;
            },
            onDone: {
              target: "generatingQuery",
              actions: [
                assign({
                  schema: (_context, event) => {
                    return buildClientSchema(event.data);
                  },
                }),
              ],
            },
          },
        },
        generatingQuery: {
          invoke: {
            id: "generateQuery",
            src: async (context, event) => {
              return context.cms.api.tina.generateQuery({
                // @ts-ignore
                relativePath: context.variables.relativePath,
                section: context.section,
              });
            },
            onDone: {
              target: "ready",
              actions: assign({
                queryString: (_context, event) => {
                  return event.data.queryString;
                },
              }),
            },
          },
        },
        formifyingQuery: {
          invoke: {
            id: "formifyQuery",
            src: async (context) => {
              if (!context.schema) {
                throw new Error("Expected schema to already be defined");
              }

              const documentNode = parse(context.queryString);
              return print(formBuilder(documentNode, context.schema));
            },
            onDone: {
              target: "ready",
              actions: assign({
                queryString: (_context, event) => event.data,
              }),
            },
          },
        },
        fetching: {
          invoke: {
            id: "fetch",
            src: async (context: GraphiQLContext, event: GraphiQLEvent) => {
              return context.cms.api.tina.request(context.queryString, {
                variables: context.variables,
              });
            },
            onDone: {
              target: "ready",
              actions: assign({ result: (context, event) => event.data }),
            },
          },
        },
        ready: {
          on: {
            FETCH: "fetching",
            FORMIFY: "formifyingQuery",
            RESET: "initializing",
            SETUP_MUTATION: {
              actions: assign((context, event) => event.value),
            },
            EDIT_QUERY: {
              target: "ready",
              actions: assign({
                queryString: (context, event) => {
                  return event.value;
                },
              }),
            },
            EDIT_RESULT: {
              target: "ready",
              actions: assign({
                result: (context, event) => {
                  return event.value;
                },
              }),
            },
            CHANGE_RELATIVE_PATH: {
              target: "initializing",
              actions: assign({
                variables: (context, event) => event.value.variables,
                section: (context, event) => event.value.section,
              }),
            },
            EDIT_VARIABLES: {
              target: "ready",
              actions: assign({
                variables: (context, event) => event.value,
              }),
            },
          },
        },
      },
    },
  },
});

export const Explorer = ({
  section,
  relativePath,
}: {
  section: string;
  relativePath: string;
}) => {
  const cms = useCMS();

  const [current, send, service] = useMachine<GraphiQLContext, GraphiQLEvent>(
    graphiqlMachine,
    {
      context: {
        cms,
        queryString: "",
        result: {},
        variables: {
          relativePath,
        },
        section,
        schema: null,
      },
    }
  );

  const res = useForm<object>({
    payload: current.context.result,
    onSubmit: (args: { queryString: string; variables: object }) => {
      send({ type: "SETUP_MUTATION", value: args });
    },
  });

  React.useEffect(() => {
    send({ type: "EDIT_RESULT", value: res });
  }, [JSON.stringify(res)]);

  React.useEffect(() => {
    send({
      type: "CHANGE_RELATIVE_PATH",
      value: { variables: { relativePath }, section },
    });
  }, [relativePath]);

  const _graphiql = React.useRef();

  if (!current.context.schema) {
    return <div>Finding schema...</div>;
  }

  const fetcher = async () => {
    send({ type: "FETCH" });

    return new Promise((resolve) => {
      service.onChange((context) => {
        resolve(context.result);
      });
    });
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar linkPrefix="/graphiql" relativePath={relativePath} />
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div id="root" className="graphiql-container">
          <React.Fragment>
            {/* @ts-ignore */}
            <GraphiQL
              ref={_graphiql}
              fetcher={async () => {
                return fetcher();
              }}
              response={JSON.stringify(current.context.result, null, 2)}
              schema={current.context.schema}
              onEditQuery={(query: string) => {
                send({ type: "EDIT_QUERY", value: query });
              }}
              query={current.context.queryString}
              onEditVariables={(variables: string) => {
                try {
                  send({
                    type: "EDIT_VARIABLES",
                    value: JSON.parse(variables),
                  });
                } catch (e) {
                  // likely the input is still being edited
                }
              }}
              variables={JSON.stringify(current.context.variables, null, 2)}
            >
              {/* Hide GraphiQL logo */}
              <GraphiQL.Logo>{` `}</GraphiQL.Logo>
              <GraphiQL.Toolbar>
                <button
                  onClick={() => send("FORMIFY")}
                  className="ml-4 group flex items-center px-3 py-3 text-sm leading-5 font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:text-gray-900 focus:bg-gray-50 transition ease-in-out duration-150 tracking-wider"
                  type="button"
                >
                  Formify
                </button>
              </GraphiQL.Toolbar>
            </GraphiQL>
          </React.Fragment>
        </div>
      </div>
    </div>
  );
};
