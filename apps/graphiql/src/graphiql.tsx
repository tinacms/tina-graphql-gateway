import React from "react";
import GraphiQL from "graphiql";
// @ts-ignore no types provided
import GraphiQLExplorer from "graphiql-explorer";
import { queryBuilder } from "@forestryio/graphql-helpers";
import { Link, useParams } from "react-router-dom";
import { getIntrospectionQuery, buildClientSchema, print } from "graphql";
import { TinaProvider, TinaCMS, useCMS, useForm, usePlugin } from "tinacms";

const TinaWrap = ({ formConfig }) => {
  const cms = new TinaCMS({
    sidebar: true,
    enabled: true,
  });

  return (
    <TinaProvider cms={cms}>
      {formConfig ? <UseIt formConfig={formConfig} /> : null}
      {/* <UseIt formConfig={formConfig} /> */}
    </TinaProvider>
  );
};

const UseIt = ({ formConfig }) => {
  // console.log(formConfig.form.fields);
  const cms = useCMS();
  const formConfig2 = {
    id: "tina-tutorial-index",
    label: "Edit Page",
    fields: formConfig.form.fields,
    initialValues: formConfig.initialValues,
    onSubmit: async () => {
      window.alert("Saved!");
    },
  };
  const [editableData, form] = useForm(formConfig2);
  usePlugin(form);

  return <div />;
};

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
  const [queryResult, setQueryResult] = React.useState<null | { data: object }>(
    null
  );

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
      return response.json().then((json) => {
        if (json?.data?.document) {
          setQueryResult(json.data.document);
        }
        return json;
      });
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
      {queryResult && <TinaWrap formConfig={queryResult} />}
      <React.Fragment>
        <GraphiQLExplorer
          schema={schema}
          query={query || ""}
          onEdit={_handleEditQuery}
          explorerIsOpen={state.explorerIsOpen}
          onToggleExplorer={_handleToggleExplorer}
          onRunOperation={(operationName: any) => {
            _graphiql.handleRunQuery(operationName);
          }}
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
