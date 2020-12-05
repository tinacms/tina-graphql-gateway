import React from "react";
import GraphiQL from "graphiql";
import { formBuilder } from "@forestryio/graphql-helpers";
import { useParams } from "react-router-dom";
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
    editor: {
      states: {
        fetchingSchema: {};
        generatingQuery: {};
        ready: {};
        error: {};
        formifyingQuery: {};
      };
    };
  };
}

// The events that the machine handles
type GraphiQLEvent =
  | { type: "TIMER" }
  | {
      type: "CHANGE_VARIABLES";
      value: { section: string; relativePath: string };
    }
  | { type: "TOGGLE_EXPLORER" }
  | { type: "OPEN_EXPLORER" }
  | { type: "CLOSE_EXPLORER" }
  | { type: "TOGGLE_OUTPUT" }
  | { type: "OPEN_OUTPUT" }
  | { type: "CLOSE_OUTPUT" }
  | { type: "FORMIFY" }
  | { type: "EDIT_QUERY"; value: string }
  | { type: "PED_COUNTDOWN"; duration: number };

interface GraphiQLContext {
  graphQLFetcher: (args: FetcherArgs) => Promise<object>;
  cms: TinaCMS;
  variables: { section: string; relativePath: string };
  schema: null | GraphQLSchema;
  queryString: string;
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
    editor: {
      initial: "fetchingSchema",
      states: {
        fetchingSchema: {
          invoke: {
            id: "fetchSchema",
            src: async (context) => {
              return context.graphQLFetcher({ query: getIntrospectionQuery() });
            },
            onDone: {
              target: "generatingQuery",
              actions: assign({
                schema: (_context, event) => buildClientSchema(event.data),
              }),
            },
          },
        },
        generatingQuery: {
          invoke: {
            id: "generateQuery",
            src: async (context) => {
              return context.cms.api.forestry.generateQuery(context.variables);
            },
            onError: {
              target: "error",
            },
            onDone: {
              target: "ready",
              actions: assign({
                queryString: (_context, event) => event.data,
              }),
            },
          },
        },
        error: {
          type: "final",
        },
        ready: {
          on: {
            CHANGE_VARIABLES: {
              target: "generatingQuery",
              actions: assign({
                variables: (_context, event) => event.value,
              }),
            },
            EDIT_QUERY: {
              actions: assign({
                queryString: (_context, event) => event.value,
              }),
            },
            FORMIFY: "formifyingQuery",
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
              target: "error",
            },
            onDone: {
              target: "ready",
              actions: assign({
                queryString: (_context, event) => event.data,
              }),
            },
          },
        },
      },
    },
  },
});

type FetcherArgs = {
  query: string;
  variables?: object;
  operationName?: string;
};

export const Explorer = () => {
  let { project, section, ...path } = useParams();
  const variables = { section, relativePath: path[0] };

  React.useEffect(() => {
    send({ type: "CHANGE_VARIABLES", value: variables });
  }, [variables.section, variables.relativePath]);

  const cms = useCMS();
  const graphQLFetcher = async (graphQLParams: {
    query: string;
    variables?: object;
    operationName?: string;
  }) => {
    try {
      return cms.api.forestry
        .request(graphQLParams.query, {
          variables: graphQLParams.variables || {},
        })
        .then((response: unknown) => {
          return response;
        });
    } catch (e) {
      console.log(e);
    }
  };

  const [current, send] = useMachine(graphiqlMachine, {
    context: {
      graphQLFetcher,
      cms,
      variables,
      queryString: "",
      explorerIsOpen: false,
      outputIsOpen: false,
      schema: null,
    },
  });

  console.log(current.value);

  const _graphiql = React.useRef();

  if (!current.context.schema) {
    return <div>Finding schema...</div>;
  }

  return (
    <div id="root" className="graphiql-container">
      <TinaInfo
        isOpen={current.matches("outputIsOpen.open")}
        variables={current.context.variables}
      />
      <React.Fragment>
        {/* @ts-ignore */}
        <GraphiQL
          ref={_graphiql}
          fetcher={graphQLFetcher}
          schema={current.context.schema}
          onEditQuery={(query: string) => {
            send({ type: "EDIT_QUERY", value: query });
          }}
          query={current.context.queryString}
          variables={JSON.stringify(
            { relativePath: variables.relativePath },
            null,
            2
          )}
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
  variables,
  isOpen,
}: {
  variables: { section: string; relativePath: string };
  isOpen: boolean;
}) => {
  const { data, errors } = useForestryForm2({
    payload: {},
    variables,
    fetcher: async () => {},
  });
  return (
    <div
      style={{ left: "21rem", top: "65px" }}
      className={`absolute right-0 bottom-0 p-10 bg-white z-20 shadow-lg overflow-scroll ${
        isOpen
          ? "opacity-1 pointer-events-all"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-gray-100 p-4">
        <pre>
          <code className="text-xs">{JSON.stringify(data, null, 2)}</code>
        </pre>
      </div>
    </div>
  );
};

// const UseIt = ({
//   formConfig,
//   outputIsOpen,
//   variables,
//   onSubmit,
//   payload,
// }: {
//   schema: GraphQLSchema;
//   formConfig: any;
//   outputIsOpen: boolean;
//   variables: object;
//   onSubmit: (values: any) => void;
//   payload: null | object;
// }) => {
//   // onSubmit: (values: unknown, transformedValues: unknown) => {
//   //   onSubmit(transformedValues);
//   // },

//   const { data, errors } = useForestryForm2({
//     payload,
//     variables,
//     fetcher: async () => {},
//   });

//   return (
//     <div
//       style={{ left: "21rem", top: "65px" }}
//       className={`absolute right-0 bottom-0 p-10 bg-white z-20 shadow-lg overflow-scroll ${
//         outputIsOpen
//           ? "opacity-1 pointer-events-all"
//           : "opacity-0 pointer-events-none"
//       }`}
//     >
//       <div className="bg-gray-100 p-4">
//         <pre>
//           <code className="text-xs">{JSON.stringify(data, null, 2)}</code>
//         </pre>
//       </div>
//     </div>
//   );
// };
