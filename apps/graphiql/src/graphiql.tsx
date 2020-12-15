import React from "react";
import GraphiQL from "graphiql";
import { formBuilder } from "@forestryio/graphql-helpers";
import { useParams, useLocation } from "react-router-dom";
import { useMachine } from "@xstate/react";
import { Machine, assign } from "xstate";
import { useForestryForm2 } from "@forestryio/client";
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
    explorerIsOpen: {
      states: {
        closed: {};
        open: {};
      };
    };
    outputIsOpen: {
      states: {
        closed: {};
        open: {};
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
  | {
      type: "CHANGE_MUTATE";
      value: boolean;
    }
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
    }
  | { type: "FETCH" }
  | { type: "TOGGLE_EXPLORER" }
  | { type: "TOGGLE_EXPLORER" }
  | { type: "OPEN_EXPLORER" }
  | { type: "CLOSE_EXPLORER" }
  | { type: "QUERY_TO_MUTATION" }
  | { type: "MODIFY_RESULT"; value: object }
  | { type: "TOGGLE_OUTPUT" }
  | { type: "OPEN_OUTPUT" }
  | { type: "CLOSE_OUTPUT" }
  | { type: "FORMIFY" }
  | { type: "EDIT_QUERY"; value: string }
  | { type: "EDIT_VARIABLES"; value: object }
  | { type: "PED_COUNTDOWN"; duration: number };

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
  explorerIsOpen: boolean;
  outputIsOpen: boolean;
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
              actions: assign({
                fetcherType: "tina",
                result: (context, event) => {
                  return event.value;
                },
              }),
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
    explorerIsOpen: {
      initial: "closed",
      states: {
        closed: {
          on: {
            TOGGLE_EXPLORER: "open",
            OPEN_EXPLORER: "open",
          },
        },
        open: {
          on: {
            TOGGLE_EXPLORER: "closed",
            CLOSE_EXPLORER: "closed",
          },
        },
      },
    },
    outputIsOpen: {
      initial: "closed",
      states: {
        closed: {
          on: {
            TOGGLE_OUTPUT: "open",
            OPEN_OUTPUT: "open",
          },
        },
        open: {
          on: {
            TOGGLE_OUTPUT: "closed",
            CLOSE_OUTPUT: "closed",
          },
        },
      },
    },
    variables: {
      initial: "idle",
      states: {
        idle: {
          on: {
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
  let submitButtonRef = null;

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
      explorerIsOpen: false,
      outputIsOpen: false,
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
  // console.log(current.value.editor);
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
        isOpen={current.matches("outputIsOpen.open")}
        variables={current.context.variables}
        section={current.context.section}
        queryString={current.context.queryString}
        fetcher={fetcher}
        result={current.context.result}
        onDataChange={(value) => {
          send({ type: "MODIFY_RESULT", value });
          service.onChange((s) => {
            submitButtonRef.click();
          });
        }}
        onFormSubmit={(value) => {
          send({
            type: "EDIT_VARIABLES",
            value: {
              relativePath: current.context.variables.relativePath,
              params: value,
            },
          });
          send({ type: "QUERY_TO_MUTATION" });
        }}
      />
      <React.Fragment>
        {/* @ts-ignore */}
        <GraphiQL
          ref={_graphiql}
          // fetcher={fetcher}
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
            <button
              type="button"
              onClick={() => send("TOGGLE_OUTPUT")}
              className="ml-4 group flex items-center px-3 py-3 text-sm leading-5 font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:text-gray-900 focus:bg-gray-50 transition ease-in-out duration-150 tracking-wider"
            >
              Output
            </button>
          </GraphiQL.Toolbar>
        </GraphiQL>
      </React.Fragment>
    </div>
  );
};

const TinaInfo = ({
  isOpen,
  variables,
  queryString,
  section,
  fetcher,
  result,
  onFormSubmit,
  onDataChange,
}: {
  variables: object;
  section: string;
  queryString: string;
  isOpen: boolean;
  fetcher: () => Promise<unknown>;
  result: object | null;
  onFormSubmit: (payload: object) => void;
  onDataChange: (payload: object) => void;
}) => {
  const { data, errors } = useForestryForm2({
    queryString,
    payload: result || {},
    variables,
    section,
    fetcher,
    onChange: (data) => {
      onDataChange(data);
    },
    callback: (payload) => {
      onFormSubmit(payload);
    },
  });

  return null;
};
