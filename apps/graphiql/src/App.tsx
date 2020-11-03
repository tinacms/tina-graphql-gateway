import React from "react";
import { Explorer } from "./graphiql";
import "./App.css";
import "graphiql/graphiql.css";
import "codemirror/lib/codemirror.css";
import { Sidebar } from "./components/sidebar";
import { useParams } from "react-router-dom";
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

import { TinaProvider, TinaCMS } from "tinacms";

const Doit = () => {
  const [variables, setVariables] = React.useState<object>({
    relativePath: "welcome.md",
    section: "posts",
  });
  let { externalURL, clientID } = useParams();
  return (
    <div>
      <TinaWrap serverURL={decodeURIComponent(externalURL)} clientID={clientID}>
        <div className="h-screen flex overflow-hidden bg-gray-100">
          <Sidebar
            onFileSelect={(variables) => {
              setVariables(variables);
            }}
            projects={[]}
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
    </div>
  );
};

const TinaWrap = ({
  serverURL,
  clientID = "",
  children,
}: {
  serverURL: string;
  clientID?: string;
  children: React.ReactNode;
}) => {
  const client = new ForestryClient(clientID, {
    gqlServer: serverURL,
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

const TinaFixtureProject = ({ children }: { children: React.ReactNode }) => {
  let { project } = useParams();
  const client = new ForestryClient({
    realm: "",
    clientId: "",
    redirectURI: "",
    customAPI: `http://localhost:4002/${project}`,
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

  const [variables, setVariables] = React.useState<object>({
    relativePath: "welcome.md",
    section: "posts",
  });

  React.useEffect(() => {
    const listProjects = async () => {
      const result = await fetch(`http://localhost:4002/list-projects`);
      const json = await result.json();
      setProjects(json);
      if (window.location.pathname === "/") {
        window.location = json[0].value;
      }
    };
    listProjects();
  }, []);

  return (
    <Router>
      <Switch>
        <Route path="/" exact>
          Hang on....
        </Route>
        <Route path="/external">
          <Switch>
            <Route path="/:ignore/:externalURL/:clientID">
              <Doit />
            </Route>
          </Switch>
        </Route>
        <Route path="/:project" exact>
          <TinaFixtureProject>
            <div className="h-screen flex overflow-hidden bg-gray-100">
              <Sidebar
                onFileSelect={(variables) => {
                  setVariables(variables);
                }}
                projects={projects}
              />
              <div className="flex flex-col w-0 flex-1 overflow-hidden">
                <Explorer variables={variables} />
              </div>
            </div>
          </TinaFixtureProject>
        </Route>
      </Switch>
    </Router>
  );
};

export default App;
