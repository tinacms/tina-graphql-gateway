import React from "react";
import "../app.css";
import "graphiql/graphiql.css";
import "graphiql-code-exporter/CodeExporter.css";
import "codemirror/lib/codemirror.css";

function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default App;
