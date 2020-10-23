import React from "react";
import GraphiQL from "graphiql";
// @ts-ignore no types provided
import GraphiQLExplorer from "graphiql-explorer";
import { queryBuilder } from "@forestryio/graphql-helpers";
import { Link, useParams } from "react-router-dom";
import {
  ForestryClient,
  ForestryMediaStore,
  TinacmsForestryProvider,
  useForestryForm,
} from "@forestryio/client";
import {
  getIntrospectionQuery,
  GraphQLSchema,
  buildClientSchema,
  print,
} from "graphql";
import { TinaProvider, TinaCMS, usePlugin } from "tinacms";

const UseIt = ({
  formConfig,
  onSubmit,
}: {
  schema: GraphQLSchema;
  formConfig: any;
  onSubmit: (values: any) => void;
}) => {
  console.log(formConfig.node);
  // useForestryForm(formConfig.node, {
  //   onSubmit: (values, transformedValues) => {
  //     onSubmit(transformedValues);
  //   },
  // });

  return <div />;
};

export const Explorer = (
  variables: { variables: any } = {
    relativePath: "welcome.md",
    section: "posts",
  }
) => {
  let { project } = useParams();
  const [vars, setVars] = React.useState();
  React.useEffect(() => {
    setVars(variables.variables);
  }, [variables]);
  const [state, setState] = React.useState({
    schema: null,
    query: null,
    // variables: JSON.stringify({ relativePath: "welcome.md", section: "posts" }, null, 2),
    explorerIsOpen: false,
    codeExporterIsOpen: false,
  });
  const [projects, setProjects] = React.useState<
    { label: string; value: string }[]
  >([]);
  const [queryResult, setQueryResult] = React.useState<null | { data: object }>(
    null
  );

  const graphQLFetcher = (graphQLParams: object) => {
    try {
      setQueryResult(null);
      const url = `http://localhost:4000/${project}`;
      return fetch(url, {
        method: `post`,
        headers: {
          Accept: `application/json`,
          "Content-Type": `application/json`,
        },
        body: JSON.stringify(graphQLParams),
        // credentials: `include`,
      }).then(function (response) {
        return response.json().then((json) => {
          if (json?.data?.document) {
            setQueryResult(json.data.document);
          }
          return json;
        });
      });
    } catch (e) {
      console.log(e);
    }
  };
  const _graphiql = React.useRef();

  const setVariables = (values) => {
    setVars({
      relativePath: vars.relativePath,
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
    const listProjects = async () => {
      const result = await fetch(`http://localhost:4000/list-projects`);
      const json = await result.json();
      setProjects(json);
    };
    listProjects();
  }, []);
  React.useEffect(() => {
    try {
      graphQLFetcher({
        query: getIntrospectionQuery(),
      }).then((result) => {
        const newState: { schema: any; query: null | string } = {
          schema: buildClientSchema(result.data),
          query: "",
        };

        if (!newState.query) {
          const clientSchema = buildClientSchema(result.data);
          // const query = queryBuilder(clientSchema, "documentForSection");
          const query = queryBuilder(clientSchema);
          // @ts-ignore for some reason query builder shows no return type
          newState.query = print(query);
        }

        setState({ ...state, ...newState });
      });
    } catch (e) {
      console.log(e);
    }
  }, [project]);

  const _handleEditQuery = (query: any) => {
    setState({ ...state, query });
  };

  const _handleToggleExplorer = () => {
    setState({ ...state, explorerIsOpen: !state.explorerIsOpen });
  };

  const { query, schema } = state;

  return (
    <div id="root" className="graphiql-container">
      {queryResult && (
        <UseIt
          onSubmit={setVariables}
          project={project}
          schema={schema}
          formConfig={queryResult}
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
          query={query}
          variables={JSON.stringify(vars, null, 2)}
        >
          {/* Hide GraphiQL logo */}
          <GraphiQL.Logo>{` `}</GraphiQL.Logo>
          <GraphiQL.Toolbar>
            {projects.map((project) => {
              return (
                <Link to={`/${project.value}`}>
                  {/* @ts-ignore */}
                  <GraphiQL.Button key={project.value} label={project.label} />
                </Link>
              );
            })}
            {/* @ts-ignore */}
            <GraphiQL.Button
              key="explorer"
              onClick={_handleToggleExplorer}
              label="Explorer"
              title="Toggle Explorer"
            />
          </GraphiQL.Toolbar>
        </GraphiQL>
      </React.Fragment>
    </div>
  );
};
