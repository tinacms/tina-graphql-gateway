import React from "react";
import GraphiQL from "graphiql";
import GraphiQLExplorer from "graphiql-explorer";
import { getIntrospectionQuery, buildClientSchema, parse } from "graphql";
import CodeExporter from "graphiql-code-exporter";
import snippets from "./snippets";

type ParameterType = {
  variables?: any;
  operationName?: any;
  query?: any;
};
const parameters: ParameterType = {};
function locationQuery(params) {
  return (
    `?` +
    Object.keys(params)
      .map(function (key) {
        return encodeURIComponent(key) + `=` + encodeURIComponent(params[key]);
      })
      .join(`&`)
  );
}

function onEditVariables(newVariables) {
  parameters.variables = newVariables;
  updateURL();
}
function onEditOperationName(newOperationName) {
  parameters.operationName = newOperationName;
  updateURL();
}
function updateURL() {
  history.replaceState(null, null, locationQuery(parameters));
}

const DEFAULT_QUERY = parameters.query || undefined;

const DEFAULT_VARIABLES = parameters.variables || undefined;

const QUERY_EXAMPLE_FALLBACK = `#     {
#       document(path: $path) {
#         __typename
#       }
#     }`;

function generateDefaultFallbackQuery(queryExample) {
  return `# Welcome to GraphiQL
#
# GraphiQL is an in-browser tool for writing, validating, and
# testing GraphQL queries.
#
# Type queries into this side of the screen, and you will see intelligent
# typeaheads aware of the current GraphQL type schema and live syntax and
# validation errors highlighted within the text.
#
# GraphQL queries typically start with a "{" character. Lines that starts
# with a # are ignored.
#
# An example GraphQL query might look like:
#
${queryExample}
#
# Keyboard shortcuts:
#
#  Prettify Query:  Shift-Ctrl-P (or press the prettify button above)
#
#     Merge Query:  Shift-Ctrl-M (or press the merge button above)
#
#       Run Query:  Ctrl-Enter (or press the play button above)
#
#   Auto Complete:  Ctrl-Space (or just start typing)
#
`;
}

class App extends React.Component {
  state = {
    schema: null,
    query: DEFAULT_QUERY,
    variables: DEFAULT_VARIABLES,
    explorerIsOpen: true,
    codeExporterIsOpen: false,
  };

  graphQLFetcher = (graphQLParams) => {
    return fetch(this.props.url, {
      method: `post`,
      headers: {
        Accept: `application/json`,
        "Content-Type": `application/json`,
      },
      body: JSON.stringify(graphQLParams),
      credentials: `include`,
    }).then(function (response) {
      return response.json();
    });
  };

  componentDidMount() {
    this.graphQLFetcher({
      query: getIntrospectionQuery(),
    }).then((result) => {
      const newState = { schema: buildClientSchema(result.data) };

      if (this.state.query === null) {
        if (!newState.query) {
          newState.query = generateDefaultFallbackQuery(QUERY_EXAMPLE_FALLBACK);
        }
      }

      this.setState(newState);
    });

    const editor = this._graphiql.getQueryEditor();
    editor.setOption(`extraKeys`, {
      ...(editor.options.extraKeys || {}),
      "Shift-Alt-LeftClick": this._handleInspectOperation,
    });
  }

  _handleInspectOperation = (cm, mousePos) => {
    const parsedQuery = parse(this.state.query || ``);

    if (!parsedQuery) {
      console.error(`Couldn't parse query document`);
      return null;
    }

    const token = cm.getTokenAt(mousePos);
    const start = { line: mousePos.line, ch: token.start };
    const end = { line: mousePos.line, ch: token.end };
    const relevantMousePos = {
      start: cm.indexFromPos(start),
      end: cm.indexFromPos(end),
    };

    const position = relevantMousePos;

    const def = parsedQuery.definitions.find((definition) => {
      if (!definition.loc) {
        console.log(`Missing location information for definition`);
        return false;
      }

      const { start, end } = definition.loc;
      return start <= position.start && end >= position.end;
    });

    if (!def) {
      console.error(
        `Unable to find definition corresponding to mouse position`
      );
      return null;
    }

    const operationKind =
      def.kind === `OperationDefinition`
        ? def.operation
        : def.kind === `FragmentDefinition`
        ? `fragment`
        : `unknown`;

    const operationName =
      def.kind === `OperationDefinition` && !!def.name
        ? def.name.value
        : def.kind === `FragmentDefinition` && !!def.name
        ? def.name.value
        : `unknown`;

    const selector = `.graphiql-explorer-root #${operationKind}-${operationName}`;

    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView();
      return true;
    }

    return false;
  };

  _handleEditQuery = (query) => {
    parameters.query = query;
    updateURL();
    this.setState({ query });
  };

  _handleToggleExplorer = () => {
    const newExplorerIsOpen = !this.state.explorerIsOpen;
    parameters.explorerIsOpen = newExplorerIsOpen;
    updateURL();
    this.setState({ explorerIsOpen: newExplorerIsOpen });
  };

  _handleToggleExporter = () => {
    const newCodeExporterIsOpen = !this.state.codeExporterIsOpen;
    parameters.codeExporterIsOpen = newCodeExporterIsOpen;
    updateURL();
    this.setState({ codeExporterIsOpen: newCodeExporterIsOpen });
  };

  render() {
    const { query, variables, schema, codeExporterIsOpen } = this.state;
    const codeExporter = codeExporterIsOpen ? (
      <CodeExporter
        hideCodeExporter={this._handleToggleExporter}
        snippets={snippets}
        query={query}
        codeMirrorTheme="default"
      />
    ) : null;

    return (
      <div id="root" className="graphiql-container">
        <React.Fragment>
          <GraphiQLExplorer
            schema={schema}
            query={query}
            onEdit={this._handleEditQuery}
            explorerIsOpen={this.state.explorerIsOpen}
            onToggleExplorer={this._handleToggleExplorer}
            onRunOperation={(operationName) =>
              this._graphiql.handleRunQuery(operationName)
            }
          />
          <GraphiQL
            ref={(ref) => (this._graphiql = ref)}
            fetcher={this.graphQLFetcher}
            schema={schema}
            query={query}
            variables={variables}
            onEditQuery={this._handleEditQuery}
            onEditVariables={onEditVariables}
            onEditOperationName={onEditOperationName}
          >
            <GraphiQL.Toolbar>
              <GraphiQL.Button
                onClick={() => this._graphiql.handlePrettifyQuery()}
                label="Prettify"
                title="Prettify Query (Shift-Ctrl-P)"
              />
              <GraphiQL.Button
                onClick={() => this._graphiql.handleToggleHistory()}
                label="History"
                title="Show History"
              />
              <GraphiQL.Button
                onClick={this._handleToggleExplorer}
                label="Explorer"
                title="Toggle Explorer"
              />
              <GraphiQL.Button
                onClick={this._handleToggleExporter}
                label="Code Exporter"
                title="Toggle Code Exporter"
              />
            </GraphiQL.Toolbar>
          </GraphiQL>
          {codeExporter}
        </React.Fragment>
      </div>
    );
  }
}

export default App;

// const App2 = ({ url }: { url: string }) => {
//   const [codeExporterIsOpen, setCodeExporterIsOpen] = React.useState(false);
//   const [explorerIsOpen, setExplorerIsOpen] = React.useState(false);
//   const [query, setQuery] = React.useState()
//   const graphiqlRef = React.useRef()

//   const _handleToggleExporter = () => {
//     setCodeExporterIsOpen(!codeExporterIsOpen);
//   };
//   const _handleToggleExplorer = () => {
//     setExplorerIsOpen(!explorerIsOpen);
//   };

//   const { variables, schema } = this.state;
//   const codeExporter = codeExporterIsOpen ? (
//     <CodeExporter
//       hideCodeExporter={_handleToggleExporter}
//       snippets={snippets}
//       query={query}
//       codeMirrorTheme="default"
//     />
//   ) : null;

//   return (
//     <div id="root" className="graphiql-container">
//       <React.Fragment>
//         <GraphiQLExplorer
//           schema={schema}
//           query={query}
//           onEdit={this._handleEditQuery}
//           explorerIsOpen={explorerIsOpen}
//           onToggleExplorer={_handleToggleExplorer}
//           onRunOperation={(operationName) =>
//             this._graphiql.handleRunQuery(operationName)
//           }
//         />
//         <GraphiQL
//           ref={(ref) => (graphiqlRef = ref)}
//           fetcher={this.graphQLFetcher}
//           schema={schema}
//           query={query}
//           variables={variables}
//           onEditQuery={this._handleEditQuery}
//           onEditVariables={onEditVariables}
//           onEditOperationName={onEditOperationName}
//         >
//           <GraphiQL.Toolbar>
//             <GraphiQL.Button
//               onClick={() => this._graphiql.handlePrettifyQuery()}
//               label="Prettify"
//               title="Prettify Query (Shift-Ctrl-P)"
//             />
//             <GraphiQL.Button
//               onClick={() => this._graphiql.handleToggleHistory()}
//               label="History"
//               title="Show History"
//             />
//             <GraphiQL.Button
//               onClick={this._handleToggleExplorer}
//               label="Explorer"
//               title="Toggle Explorer"
//             />
//             <GraphiQL.Button
//               onClick={this._handleToggleExporter}
//               label="Code Exporter"
//               title="Toggle Code Exporter"
//             />
//           </GraphiQL.Toolbar>
//         </GraphiQL>
//         {codeExporter}
//       </React.Fragment>
//     </div>
//   );
// };
