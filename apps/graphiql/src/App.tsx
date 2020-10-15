import React from "react";
import { Explorer } from "./graphiql";
import "./App.css";
import "graphiql/graphiql.css";
import "codemirror/lib/codemirror.css";
import { Sidebar } from "./components/sidebar";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";

const App = () => {
  const [projects, setProjects] = React.useState<
    { label: string; value: string }[]
  >([]);

  const [pathVariable, setPathVariable] = React.useState<string>("");

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
          <div className="h-screen flex overflow-hidden bg-gray-100">
            <Sidebar
              onFileSelect={(path) => {
                setPathVariable(path);
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
              <Explorer pathVariable={pathVariable} />
            </div>
          </div>
        </Route>
      </Switch>
    </Router>
  );
};

export default App;
