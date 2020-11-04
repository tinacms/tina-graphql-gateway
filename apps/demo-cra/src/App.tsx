import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { ForestryClient } from "@forestryio/client"
import {Query, Home_Data} from "../.tina/types"

function App() {

  const client = new ForestryClient("")

  const [content,setContent] = useState<Home_Data | undefined>()

  useEffect(() => {
    const run = async () => {
      const content = await client.getContentForSection<Query>({relativePath: "home.md", section: "pages"})
        setContent(content?.document?.node?.data || undefined)
    }
    run()
  },[])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
         {content?.title || "Loading"}
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
