import React from "react";
import { Explorer } from "./graphiql";
import "./App.css";
import "graphiql/graphiql.css";
import "codemirror/lib/codemirror.css";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";

const App = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact>
          <Redirect to="/project1" />
        </Route>
        <Route path="/:project" exact>
          <Explorer />;
        </Route>
      </Switch>
    </Router>
  );
};

export default App;
