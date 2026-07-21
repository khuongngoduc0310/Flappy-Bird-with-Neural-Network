import './App.css';
import ParameterForm from './components/ParameterForm';
import sketch from './sketches/sketch'
import P5Wrapper from './components/P5Wrapper';
import FitnessChart from './components/FitnessChart';
import React, { useState, useCallback } from 'react';

function App() {
  const [parameters, setParameters] = useState({
    numOfBirds: 1000,
    mutationRate: 0.1,
    mutationStrength: 0.1,
    ticksPerFrame: 1,
    bestBird: null,
    brainDimensions: [5, 1]
  });

  const [generationHistory, setGenerationHistory] = useState([]);

  const handleGenerationEnd = useCallback((data) => {
    if (data === null) {
      setGenerationHistory([]);
    } else {
      setGenerationHistory(prev => [...prev, data]);
    }
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Neural Network Flappy Bird</h1>
      </header>
      <main className="App-main">
        <div className="Sidebar left">
          <div className="Controls-container">
            <h2>Configuration</h2>
            <ParameterForm parameters={parameters} onChangeParameters={setParameters} />
          </div>
        </div>

        <div className="Game-container">
          <P5Wrapper
            sketch={sketch}
            parameters={parameters}
            onGenerationEnd={handleGenerationEnd}
          />
        </div>

        <div className="Sidebar right">
          <div className="Stats-container">
            <h2>Live Training Stats</h2>
            <FitnessChart data={generationHistory} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
