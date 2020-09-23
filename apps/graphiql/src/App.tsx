import React from "react";
import { Explorer } from "./graphiql";
import "./App.css";
import "graphiql/graphiql.css";
import "codemirror/lib/codemirror.css";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

interface AppProps {}

// const url = "http://localhost:4004/api/graphql"
const url = "http://localhost:4000/project1";

function App({}: AppProps) {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Project 1</Link>
            </li>
            <li>
              <Link to="/project2">Project 2</Link>
            </li>
          </ul>
        </nav>

        {/* A <Switch> looks through its children <Route>s and
        renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/project2">
            <Explorer path="project2" />;
          </Route>
          <Route path="/">
            <Explorer path="project1" />;
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
