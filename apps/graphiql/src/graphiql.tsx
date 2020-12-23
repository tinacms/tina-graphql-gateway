import React from "react";
import GraphiQL from "graphiql";
import { formBuilder } from "@forestryio/graphql-helpers";
import { useParams } from "react-router-dom";
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
  result: null | object;
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
  initial: "project",
  states: {
    project: {
      initial: "initializing",
      states: {
        initializing: {
          invoke: {
            id: "fetchSchema",
            src: async (context) => {
              return await context.cms.api.forestry.request(
                getIntrospectionQuery(),
                { variables: {} }
              );
            },
            onDone: {
              target: "generatingQuery",
              actions: assign({
                schema: (_context, event) => buildClientSchema(event.data),
                result: () => {},
              }),
            },
          },
        },
        generatingQuery: {
          invoke: {
            id: "generateQuery",
            src: async (context, event) => {
              return context.cms.api.forestry.generateQuery({
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
            src: async (context, event) => {
              return context.cms.api.forestry.request(context.queryString, {
                variables: context.variables,
              });
            },
            onDone: {
              target: "ready",
              actions: assign({
                result: (_context, event) => event.data,
              }),
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

export const Explorer = () => {
  let { project, section, ...path } = useParams();

  const cms = useCMS();

  const [current, send, service] = useMachine(graphiqlMachine, {
    context: {
      cms,
      queryString: "",
      result: {},
      variables: {
        relativePath: path[0],
      },
      section,
      schema: null,
    },
  });

  React.useEffect(() => {
    const relativePath = path[0];
    send({
      type: "CHANGE_RELATIVE_PATH",
      value: { variables: { relativePath }, section },
    });
  }, [path[0]]);

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
    <div id="root" className="graphiql-container">
      <TinaInfo
        queryString={current.context.queryString}
        result={current.context.result}
        onSubmit={(args) => {
          send({ type: "SETUP_MUTATION", value: args });
        }}
        onDataChange={(value) => {
          send({ type: "EDIT_RESULT", value });
        }}
      />
      <React.Fragment>
        {/* @ts-ignore */}
        <GraphiQL
          ref={_graphiql}
          fetcher={async (args) => {
            return fetcher(args);
          }}
          response={JSON.stringify(current.context.result, null, 2)}
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
  const res = useForestryForm({
    queryString,
    payload: result || {},
    onSubmit: (args: { queryString: string; variables: object }) => {
      onSubmit(args);
    },
  });
  console.log("tinainfo", res);

  return null;
};
