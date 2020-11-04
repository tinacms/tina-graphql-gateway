import React from 'react';
import { Home_Data } from '../.tina/types';
import logo from './logo.svg';
import './App.css';
import { useCMS } from "tinacms";


export const Home = ({content}: {content: Home_Data}) => {
  return <div className="App">
  <header className="App-header">
    <img src={logo} className="App-logo" alt="logo" />
    <p>
     {content.title}
    </p>
    <a
      className="App-link"
      href="https://reactjs.org"
      target="_blank"
      rel="noopener noreferrer"
    >
      Learn React
    </a>
    <EditLink />
  </header>
</div>
}

export const EditLink = () => {
  const cms = useCMS();

  return (
    <button onClick={() => cms.toggle()}>
      {cms.enabled ? "Exit Edit Mode" : "Edit This Site"}
    </button>
  );
};
