import React from "react";
import GraphiQL from "graphiql";
// @ts-ignore no types provided
import GraphiQLExplorer from "graphiql-explorer";
import { queryBuilder } from "@forestryio/graphql-helpers";
import { Link, useParams } from "react-router-dom";
import { getIntrospectionQuery, buildClientSchema, print } from "graphql";

export const Explorer = () => {
  let { project } = useParams();
  const [state, setState] = React.useState({
    schema: null,
    query: null,
    variables: JSON.stringify({ path: "posts/1.md" }, null, 2),
    explorerIsOpen: true,
    codeExporterIsOpen: false,
  });
  const [projects, setProjects] = React.useState<
    { label: string; value: string }[]
  >([]);

  const graphQLFetcher = (graphQLParams: object) => {
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
      return response.json();
    });
  };
  const _graphiql = React.useRef();

  React.useEffect(() => {
    const listProjects = async () => {
      const result = await fetch(`http://localhost:4000/list-projects`);
      const json = await result.json();
      setProjects(json);
    };
    listProjects();
  }, []);
  React.useEffect(() => {
    graphQLFetcher({
      query: getIntrospectionQuery(),
    }).then((result) => {
      const newState: { schema: any; query: null | string } = {
        schema: buildClientSchema(result.data),
        query: "",
      };

      if (!newState.query) {
        const clientSchema = buildClientSchema(result.data);
        const query = queryBuilder(clientSchema);
        // @ts-ignore for some reason query builder shows no return type
        newState.query = print(query);
      }

      setState({ ...state, ...newState });
    });
  }, [project]);

  const _handleEditQuery = (query: any) => {
    setState({ ...state, query });
  };

  const _handleToggleExplorer = () => {
    setState({ ...state, explorerIsOpen: !state.explorerIsOpen });
  };

  const { query, variables, schema } = state;

  return (
    <div id="root" className="graphiql-container">
      <React.Fragment>
        <GraphiQLExplorer
          schema={schema}
          query={query || ""}
          onEdit={_handleEditQuery}
          explorerIsOpen={state.explorerIsOpen}
          onToggleExplorer={_handleToggleExplorer}
          onRunOperation={(operationName: any) =>
            _graphiql.handleRunQuery(operationName)
          }
        />
        {/* @ts-ignore */}
        <GraphiQL
          ref={_graphiql}
          fetcher={graphQLFetcher}
          schema={schema}
          query={query}
          variables={variables}
        >
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
