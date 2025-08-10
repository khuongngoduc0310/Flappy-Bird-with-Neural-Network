import './App.css';
import { ReactP5Wrapper } from "@p5-wrapper/react";
import ParameterForm from './components/ParameterForm';
import sketch from './sketches/sketch'
import React, { useState } from 'react';

function App() {
  const [parameters, setParameters] = useState({
    numOfBirds: 1000,
    mutationRate: 0.1
  });

  return (
    <div className="App">
      <header className="App-header">
        <h1>Neural Network Flappy Birds</h1>
        <ParameterForm parameters={parameters} onChangeParameters={setParameters}/>
        <ReactP5Wrapper sketch={sketch} parameters={parameters}/>
      </header>
    </div>
  );
}

export default App;
