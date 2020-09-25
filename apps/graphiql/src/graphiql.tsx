import React from "react";
import GraphiQL from "graphiql";
// @ts-ignore no types provided
import GraphiQLExplorer from "graphiql-explorer";
import { queryBuilder } from "@forestryio/graphql-helpers";
import { Link, useParams } from "react-router-dom";
import { getIntrospectionQuery, buildClientSchema, print } from "graphql";
import { TinaProvider, TinaCMS, useCMS, useForm, usePlugin } from "tinacms";
import { handle } from "./handler";

// {
// 	"params": {
// 		"PostInput": {
// 			"data": {
// 				"author": "content/authors/christian.md",
// 				"image": "/uploads/dreams-on-hold.jpg",
// 				"title": "Dreams on Hold"
// 			}
// 		}
// 	}
// }

const TinaWrap = ({ formConfig, onSubmit }) => {
  const cms = new TinaCMS({
    sidebar: true,
    enabled: true,
  });

  return (
    <TinaProvider cms={cms}>
      {formConfig ? (
        <UseIt onSubmit={onSubmit} formConfig={formConfig} />
      ) : null}
      {/* <UseIt formConfig={formConfig} /> */}
    </TinaProvider>
  );
};

const UseIt = ({ formConfig, onSubmit }) => {
  // console.log(formConfig.form.fields);
  const cms = useCMS();
  const formConfig2 = {
    id: "tina-tutorial-index",
    label: "Edit Page",
    fields: formConfig.form.fields,
    initialValues: formConfig.initialValues,
    onSubmit: async (values) => {
      const payload = handle(values);
      onSubmit(payload);
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
  };
  const _graphiql = React.useRef();

  const setVariables = (values) => {
    console.log("stting variables", values);
    setState({
      ...state,
      query:
        "mutation updateDocumentMutation($path: String!, $params: DocumentInput) {      updateDocument(path: $path, params: $params) {        __typename      }    }",
      variables: JSON.stringify(
        { path: state.variables.path, params: values },
        null,
        2
      ),
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
      {queryResult && (
        <TinaWrap onSubmit={setVariables} formConfig={queryResult} />
      )}
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
