import React from "react";
import GraphiQL from "graphiql";
// @ts-ignore no types provided
import GraphiQLExplorer from "graphiql-explorer";
import { queryBuilder } from "@forestryio/graphql-helpers";
import { Link, useParams } from "react-router-dom";
import {
  getIntrospectionQuery,
  GraphQLSchema,
  buildClientSchema,
  print,
} from "graphql";
import {
  TinaProvider,
  TinaCMS,
  useCMS,
  useForm,
  Form,
  usePlugin,
} from "tinacms";
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

const TinaWrap = ({ schema, formConfig, onSubmit }) => {
  const cms = new TinaCMS({
    sidebar: {
      position: "overlay",
    },
    enabled: true,
  });

  return (
    <TinaProvider cms={cms}>
      {formConfig ? (
        <UseIt schema={schema} onSubmit={onSubmit} formConfig={formConfig} />
      ) : null}
      {/* <UseIt formConfig={formConfig} /> */}
    </TinaProvider>
  );
};

const UseIt = ({ schema, formConfig, onSubmit }: { schema: GraphQLSchema }) => {
  useCMS();
  // TODO: use yup to build a validation schema based on the arg requirements
  // Not sure if we have enough info to know if somethin is non-null
  // but GraphiQL seems to be able to do it without a network call so should be
  // possible
  // HERE /Users/jeffsee/code/scratch/graphiql/packages/codemirror-graphql/variables/lint.js
  // const mutation = schema.getMutationType();
  // const mutations = mutation?.getFields();
  // const updateDocument = Object.values(mutations)[0];
  // console.log(schema.getTypeMap());
  const [, form] = useForm({
    id: "tina-tutorial-index",
    validate: (values) => {
      // return {
      //   title: "oh no",
      //   author: "noooo",
      //   // TODO: raise an issue with OSS team to see how to do this
      //   sections: [null, "Oh noooo"],
      // };
      return undefined;
    },
    label: "Edit Page",
    fields: formConfig.form.fields,
    initialValues: formConfig.initialValues,
    onSubmit: async (values) => {
      const payload = handle(values, formConfig.form);
      onSubmit(payload);
    },
  });
  usePlugin(form);

  return <div />;
};

export const Explorer = ({ pathVariable = "" }: { pathVariable: string }) => {
  let { project } = useParams();
  const [vars, setVars] = React.useState();
  React.useEffect(() => {
    setVars({ path: pathVariable });
  }, [pathVariable]);
  const [state, setState] = React.useState({
    schema: null,
    query: null,
    // variables: JSON.stringify({ path: "posts/1.md" }, null, 2),
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
    setVars({ path: vars.path, params: values });
    setState({
      ...state,
      query: `mutation updateDocumentMutation($path: String!, $params: DocumentInput) {
  updateDocument(path: $path, params: $params) {
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

  const { query, schema } = state;

  return (
    <div id="root" className="graphiql-container">
      {queryResult && (
        <TinaWrap
          onSubmit={setVariables}
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
