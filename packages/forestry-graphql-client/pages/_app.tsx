import React from "react";
import "../app.css";
import "graphiql/graphiql.css";

function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default App;
