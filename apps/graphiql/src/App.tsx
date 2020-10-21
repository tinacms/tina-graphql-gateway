import React from "react";
import { Explorer } from "./graphiql";
import "./App.css";
import "graphiql/graphiql.css";
import "codemirror/lib/codemirror.css";
import { Sidebar } from "./components/sidebar";
import { Link, useParams } from "react-router-dom";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import {
  ForestryClient,
  ForestryMediaStore,
  TinacmsForestryProvider,
} from "@forestryio/client";
import { TinaProvider, TinaCMS, usePlugin } from "tinacms";

const TinaWrap = ({ children }) => {
  let { project } = useParams();
  const client = new ForestryClient("", {
    gqlServer: `http://localhost:4000/${project}`,
  });
  const media = new ForestryMediaStore(client);

  const cms = new TinaCMS({
    sidebar: {
      position: "overlay",
    },
    apis: {
      forestry: client,
    },
    media: media,
    enabled: true,
  });

  return (
    <TinaProvider cms={cms}>
      <TinacmsForestryProvider
        onLogin={() => alert("enter edit mode")}
        onLogout={() => alert("exit edit mode")}
      >
        {children}
      </TinacmsForestryProvider>
    </TinaProvider>
  );
};

const App = () => {
  const [projects, setProjects] = React.useState<
    { label: string; value: string }[]
  >([]);

  const [variables, setVariables] = React.useState<string>({ path: "" });

  React.useEffect(() => {
    const listProjects = async () => {
      const result = await fetch(`http://localhost:4000/list-projects`);
      const json = await result.json();
      setProjects(json);
    };
    listProjects();
  }, []);

  return (
    <Router>
      <Switch>
        <Route path="/" exact>
          <Redirect to={`/${projects[0]}`} />
        </Route>
        <Route path="/:project" exact>
          <TinaWrap>
            <div className="h-screen flex overflow-hidden bg-gray-100">
              <Sidebar
                onFileSelect={(variables) => {
                  setVariables(variables);
                }}
                projects={projects}
                items={[
                  { icon: "chart" as const, label: "Apps", link: "/apps" },
                  {
                    icon: "lock-closed" as const,
                    label: "Providers",
                    link: "/providers",
                  },
                ]}
              />
              <div className="flex flex-col w-0 flex-1 overflow-hidden">
                <Explorer variables={variables} />
              </div>
            </div>
          </TinaWrap>
        </Route>
      </Switch>
    </Router>
  );
};

export default App;
