import React from "react";
import GraphiQL from "graphiql";
import { formBuilder } from "@forestryio/graphql-helpers";
import { useParams, useLocation } from "react-router-dom";
import { useMachine } from "@xstate/react";
import { Machine, assign } from "xstate";
import { useForestryForm } from "@forestryio/client";
import { useCMS, TinaCMS } from "tinacms";
import {
  parse,
  getIntrospectionQuery,
  GraphQLSchema,
  buildClientSchema,
  print,
} from "graphql";

interface GraphiQLStateSchema {
  states: {
    fetcher: {
      states: {
        idle: {};
        fetching: {};
      };
    };
    variables: {
      states: {
        idle: {};
      };
    };
    editor: {
      states: {
        fetchingSchema: {};
        isMutation: {};
        generatingQuery: {};
        generatingMutation: {};
        ready: {};
        formifyingQuery: {};
      };
    };
  };
}

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

// The events that the machine handles
type GraphiQLEvent =
  | { type: "FETCH" }
  | { type: "QUERY_TO_MUTATION" }
  | { type: "MODIFY_RESULT"; value: object }
  | { type: "MODIFY_QUERY"; value: object }
  | { type: "FORMIFY" }
  | { type: "EDIT_QUERY"; value: string }
  | { type: "EDIT_VARIABLES"; value: object }
  | {
      type: "CHANGE_SECTION";
      value: string;
    }
  | {
      type: "CHANGE_VARIABLES";
      value: object;
    }
  | {
      type: "CHANGE_RELATIVE_PATH";
      value: string;
    }
  | {
      type: "SET_MUTATION";
      value: object;
    };

interface GraphiQLContext {
  cms: TinaCMS;
  variables: object;
  schema: null | GraphQLSchema;
  fetcherType: "tina" | "default";
  result: null | object;
  isMutation: boolean;
  queryString: string;
  section: string;
  relativePath: string;
}

// This machine is completely decoupled from React
export const graphiqlMachine = Machine<
  GraphiQLContext,
  GraphiQLStateSchema,
  GraphiQLEvent
>({
  id: "graphiql",
  parallel: true,
  states: {
    fetcher: {
      initial: "idle",
      states: {
        idle: {
          on: {
            FETCH: "fetching",
            MODIFY_RESULT: {
              target: "updatingResult",
              actions: assign({
                fetcherType: () => "tina",
                result: (context, event) => {
                  return event.value;
                },
              }),
            },
          },
        },
        updatingResult: {
          on: {
            RESULT_UPDATED: {
              target: "idle",
            },
          },
        },
        fetching: {
          invoke: {
            id: "fetch",
            src: async (context, event) => {
              if (event.type === "FETCH") {
                return context.cms.api.forestry.request(context.queryString, {
                  variables: context.variables,
                });
              } else {
                throw new Error(
                  `Unexpected payload for fetch service with event type ${event.type}`
                );
              }
            },
            onError: {
              target: "idle",
            },
            onDone: {
              target: "idle",
              actions: assign({
                result: (_context, event) => {
                  return event.data;
                },
              }),
            },
          },
        },
      },
    },
    variables: {
      initial: "idle",
      states: {
        idle: {
          on: {
            MODIFY_QUERY: {
              target: "idle",
              actions: assign({
                variables: (context, event) => {
                  return event.value.variables;
                },
              }),
            },
            CHANGE_RELATIVE_PATH: {
              target: "idle",
              actions: assign({
                variables: (context, event) => {
                  return { relativePath: event.value };
                },
              }),
            },
            EDIT_VARIABLES: {
              target: "idle",
              actions: assign({
                variables: (context, event) => {
                  return event.value;
                },
              }),
            },
          },
        },
      },
    },
    editor: {
      initial: "fetchingSchema",
      states: {
        fetchingSchema: {
          invoke: {
            id: "fetchSchema",
            src: async (context) => {
              return await context.cms.api.forestry.request(
                getIntrospectionQuery(),
                { variables: {} }
              );
            },
            onDone: {
              target: "isMutation",
              actions: assign({
                schema: (_context, event) => buildClientSchema(event.data),
              }),
            },
          },
        },
        isMutation: {
          invoke: {
            src: async (context) => {
              if (context.isMutation) {
                throw "Mutation";
              }
            },
            onDone: "generatingQuery",
            onError: "generatingMutation",
          },
        },
        generatingQuery: {
          invoke: {
            id: "generateQuery",
            src: async (context, event) => {
              return context.cms.api.forestry.generateQuery({
                relativePath: context.variables.relativePath,
                section: context.section,
              });
            },
            onError: {
              target: "ready",
              actions: (_context, event) => {
                console.log(event);
              },
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
        generatingMutation: {
          invoke: {
            id: "generateMutation",
            src: async (context, event) => {
              return await context.cms.api.forestry.generateMutation({
                relativePath: context.variables.relativePath,
                section: context.section,
              });
            },
            onError: {
              target: "ready",
              actions: (_context, event) => {
                console.log(event);
              },
            },
            onDone: {
              target: "ready",
              actions: assign((_context, event) => {
                return {
                  queryString: event.data.queryString,
                  // fetcherType: "default",
                };
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
            onError: {
              target: "ready",
              actions: (_context, event) => {
                console.log(event);
              },
            },
            onDone: {
              target: "ready",
              actions: assign({
                queryString: (_context, event) => event.data,
              }),
            },
          },
        },
        ready: {
          on: {
            MODIFY_QUERY: {
              target: "ready",
              actions: assign({
                queryString: (context, event) => {
                  return event.value.queryString;
                },
              }),
            },
            QUERY_TO_MUTATION: {
              target: "generatingMutation",
            },
            FORMIFY: "formifyingQuery",
            CHANGE_SECTION: {
              target: "generatingQuery",
              actions: assign({
                section: (context, event) => {
                  return event.value;
                },
              }),
            },
            EDIT_QUERY: {
              target: "ready",
              actions: assign({
                queryString: (context, event) => {
                  return event.value;
                },
              }),
            },
          },
        },
      },
    },
  },
});

export const Explorer = () => {
  let { project, section, ...path } = useParams();
  const q = useQuery();
  const isMutation = !!q.get("mutate");
  let submitButtonRef: unknown = null;

  const cms = useCMS();

  const [current, send, service] = useMachine(graphiqlMachine, {
    context: {
      cms,
      queryString: "",
      fetcherType: "default",
      result: {},
      variables: {
        relativePath: path[0],
      },
      isMutation,
      section,
      schema: null,
    },
  });

  React.useEffect(() => {
    send({ type: "CHANGE_RELATIVE_PATH", value: path[0] });
  }, [path[0]]);

  React.useEffect(() => {
    if (isMutation) {
      send({ type: "QUERY_TO_MUTATION" });
    }
  }, [isMutation]);

  React.useEffect(() => {
    send({ type: "CHANGE_SECTION", value: section });
  }, [section]);

  const _graphiql = React.useRef();
  // console.log(current.value);
  React.useEffect(() => {
    const button = document.getElementsByClassName("execute-button").item(0);
    if (button) {
      submitButtonRef = button;
    }
  });

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
    <div id="root" className="graphiql-container">
      <TinaInfo
        queryString={current.context.queryString}
        result={current.context.result}
        onSubmit={(args) => {
          send({ type: "MODIFY_QUERY", value: args });
        }}
        onDataChange={(value) => {
          service.onTransition(() => {
            if (service.state.matches("fetcher.updatingResult")) {
              send("RESULT_UPDATED");
              submitButtonRef.click();
            }
          });

          send({ type: "MODIFY_RESULT", value });
        }}
      />
      <React.Fragment>
        {/* @ts-ignore */}
        <GraphiQL
          ref={_graphiql}
          fetcher={async (args) => {
            if (current.context.fetcherType === "default") {
              return fetcher(args);
            }
            return current.context.result;
          }}
          schema={current.context.schema}
          onEditQuery={(query: string) => {
            send({ type: "EDIT_QUERY", value: query });
          }}
          query={current.context.queryString}
          onEditVariables={(variables: string) => {
            try {
              send({ type: "EDIT_VARIABLES", value: JSON.parse(variables) });
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
  );
};

const TinaInfo = ({
  queryString,
  result,
  onSubmit,
  onDataChange,
}: {
  queryString: string;
  result: object | null;
  onSubmit: (payload: object) => void;
  onDataChange: (payload: object) => void;
}) => {
  useForestryForm({
    queryString,
    payload: result || {},
    onChange: (data) => {
      onDataChange(data);
    },
    onSubmit: (args: {
      mutationString: string;
      relativePath: string;
      values: object;
    }) => {
      onSubmit(args);
    },
  });

  return null;
};
