import React from "react";
import { Explorer } from "./graphiql";
import "./App.css";
import "graphiql/graphiql.css";
import "codemirror/lib/codemirror.css";

interface AppProps {}

// const url = "http://localhost:4004/api/graphql"
const url = "http://localhost:4000/me";

function App({}: AppProps) {
  return <Explorer url={url} />;
}

export default App;
