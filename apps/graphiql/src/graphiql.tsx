import React from "react";
import GraphiQL from "graphiql";
// @ts-ignore no types provided
import GraphiQLExplorer from "graphiql-explorer";
import { formBuilder, queryBuilder } from "@forestryio/graphql-helpers";
import { useParams } from "react-router-dom";
import { useForestryForm2 } from "@forestryio/client";
import { useCMS } from "tinacms";
import {
  parse,
  getIntrospectionQuery,
  GraphQLSchema,
  buildClientSchema,
  print,
} from "graphql";

const UseIt = ({
  formConfig,
  variables,
  onSubmit,
  payload,
}: {
  schema: GraphQLSchema;
  formConfig: any;
  variables: object;
  onSubmit: (values: any) => void;
  payload: object;
}) => {
  // onSubmit: (values: unknown, transformedValues: unknown) => {
  //   onSubmit(transformedValues);
  // },

  const { errors } = useForestryForm2({
    payload,
    variables,
    fetcher: async () => {},
  });

  return <div />;
};

export const Explorer = (
  variables: { variables: {} | { relativePath: string; section: string } } = {
    variables: {},
  }
) => {
  const params = useParams();

  // @ts-ignore
  const project = params.project as string;

  const [vars, setVars] = React.useState<object>({});
  const cms = useCMS();

  React.useEffect(() => {
    setVars(variables.variables);
  }, [variables]);

  const [state, setState] = React.useState<{
    schema: null | GraphQLSchema;
    query: null | string;
    variables?: object;
    explorerIsOpen: boolean;
  }>({
    schema: null,
    query: null,
    explorerIsOpen: false,
  });

  const [queryResult, setQueryResult] = React.useState<null | { data: object }>(
    null
  );
  const [editedQuery, setEditQuery] = React.useState("");

  const graphQLFetcher = async (graphQLParams: {
    query: string;
    variables?: object;
    operationName?: string;
  }) => {
    try {
      setQueryResult(null);
      return cms.api.forestry
        .request(graphQLParams.query, {
          variables: graphQLParams.variables || {},
        })
        .then((response: { document: { data: object } }) => {
          setQueryResult(response);
          return response;
        });
    } catch (e) {
      console.log(e);
    }
  };

  const _graphiql = React.useRef();

  const setVariables = (values: object) => {
    setVars({
      // @ts-ignore
      relativePath: vars.relativePath,
      // @ts-ignore
      section: vars.section,
      params: values,
    });
    setState({
      ...state,
      query: `mutation updateDocumentMutation($relativePath: String!, $section: String!, $params: DocumentInput) {
  updateDocument(relativePath: $relativePath, section: $section, params: $params) {
    __typename
  }
}`,
    });
  };

  React.useEffect(() => {
    try {
      graphQLFetcher({
        query: getIntrospectionQuery(),
      }).then((result) => {
        const newState: { schema: GraphQLSchema; query: null | string } = {
          schema: buildClientSchema(result),
          query: "",
        };

        if (!newState.query) {
          // const clientSchema = buildClientSchema(result);
          // // const query = queryBuilder(clientSchema, "documentForSection");
          // const query = queryBuilder(clientSchema);
          // @ts-ignore for some reason query builder shows no return type
          // newState.query = print(query);
          //           const q = `query DocumentQuery($relativePath: String!, $section: String!) {
          //   document(relativePath: $relativePath, section: $section) {
          //     node {
          //       __typename
          //       ... on BlockPage {
          //         data {
          //           title
          //         }
          //       }
          //     }
          //   }
          // }
          const q = `{
  node(id: "content/pages/home.md") {
    __typename
    id
  }
}

          `;
          //           const q = `query DocumentQuery($relativePath: String!) {
          //   getPagesDocument(relativePath: $relativePath) {
          //     document {
          //       __typename
          //       ...on BlockPage {
          //         data {
          //           title
          //         }
          //       }
          //     }
          //   }
          // }`;
          newState.query = q;
          setEditQuery(q);
        }

        setState({ ...state, ...newState });
      });
    } catch (e) {
      console.log(e);
    }
  }, [project]);

  const _handleFormifyQuery = () => {
    try {
      graphQLFetcher({
        query: getIntrospectionQuery(),
      }).then((result) => {
        const clientSchema = buildClientSchema(result);
        const documentNode = parse(editedQuery);

        const queryAst = formBuilder(documentNode, clientSchema);
        const newState: { schema: GraphQLSchema; query: null | string } = {
          schema: buildClientSchema(result),
          query: print(queryAst),
        };

        setState({ ...state, ...newState });
      });
    } catch (e) {
      console.log(e);
    }
  };

  const _handleEditQuery = (query: any) => {
    setState({ ...state, query });
  };

  const _handleToggleExplorer = () => {
    setState({ ...state, explorerIsOpen: !state.explorerIsOpen });
  };
  const { query, schema } = state;

  if (!schema) {
    return <div>Finding schema...</div>;
  }

  return (
    <div id="root" className="graphiql-container">
      {queryResult && (
        <UseIt
          onSubmit={setVariables}
          variables={variables.variables}
          // @ts-ignore
          project={project}
          schema={schema}
          payload={queryResult}
        />
      )}
      <React.Fragment>
        <GraphiQLExplorer
          schema={schema}
          query={query || ""}
          onEdit={_handleEditQuery}
          explorerIsOpen={state.explorerIsOpen}
          onToggleExplorer={_handleToggleExplorer}
          onRunOperation={(operationName: any) => {
            // @ts-ignore
            _graphiql.handleRunQuery(operationName);
          }}
        />
        {/* @ts-ignore */}
        <GraphiQL
          ref={_graphiql}
          fetcher={graphQLFetcher}
          schema={schema}
          onEditQuery={(query) => {
            setEditQuery(query);
          }}
          query={query}
          variables={JSON.stringify(vars, null, 2)}
        >
          {/* Hide GraphiQL logo */}
          <GraphiQL.Logo>{` `}</GraphiQL.Logo>
          <GraphiQL.Toolbar>
            <button
              onClick={_handleFormifyQuery}
              className="ml-4 group flex items-center px-3 py-3 text-sm leading-5 font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:text-gray-900 focus:bg-gray-50 transition ease-in-out duration-150 tracking-wider"
            >
              Formify
            </button>
            <button
              onClick={_handleToggleExplorer}
              className="ml-4 group flex items-center px-3 py-3 text-sm leading-5 font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:text-gray-900 focus:bg-gray-50 transition ease-in-out duration-150 tracking-wider"
            >
              Explorer
            </button>
          </GraphiQL.Toolbar>
        </GraphiQL>
      </React.Fragment>
    </div>
  );
};
