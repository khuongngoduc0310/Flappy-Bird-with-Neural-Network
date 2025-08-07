import './App.css';
import { ReactP5Wrapper } from "@p5-wrapper/react";
import ParameterForm from './components/ParameterForm';
import sketch from './sketches/sketch'
import React, {useEffect, useState} from 'react';

function App() {
  const [numOfBirds, setNumOfBirds] = useState(100);

  function onChangeBirds(e){
    if (e.target.value < 10) e.target.value = 10;
    if (e.target.value > 1000) e.target.value = 2000;
    setNumOfBirds(e.target.value);
  }
  return (
    <div className="App">
      <header className="App-header">
        <h1>Neural Network Flappy Birds</h1>
        <ParameterForm numOfBirds={numOfBirds} onChangeBirds={onChangeBirds}/>
        <ReactP5Wrapper sketch={sketch} numOfBirds={numOfBirds}/>
      </header>
    </div>
  );
}

export default App;
