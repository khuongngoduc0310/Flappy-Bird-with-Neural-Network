import './App.css';
import ParameterForm from './components/ParameterForm';
import sketch from './sketches/sketch'
import P5Wrapper from './components/P5Wrapper';
import React, { useState } from 'react';


function App() {
  const [parameters, setParameters] = useState({
    numOfBirds: 1000,
    mutationRate: 0.1,
    bestBird: null
  });

  return (
    <div className="App">
      <header className="App-header">
        <h1>Neural Network Flappy Bird</h1>
      </header>
      <main className="App-main">
        <div className="Controls-container">
          <h2>Configuration</h2>
          <ParameterForm parameters={parameters} onChangeParameters={setParameters} />
        </div>
        <div className="Game-container">
          <P5Wrapper
            sketch={sketch}
            parameters={parameters}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
