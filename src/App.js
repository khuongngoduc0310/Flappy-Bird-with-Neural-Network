import './App.css';
import ParameterForm from './components/ParameterForm';
import sketch from './sketches/sketch'
import P5Wrapper from './components/P5Wrapper';
import FitnessChart from './components/FitnessChart';
import TrainingSummary from './components/TrainingSummary';
import NeuralNetwork from './NeuralNet/nn';
import React, { useState, useCallback, useEffect, useRef } from 'react';

const CHAMPION_STORAGE_KEY = 'flappy-bird-champion';
const CHAMPION_BEST_SCORE_KEY = 'flappy-bird-champion-best-score';
const DEFAULT_BRAIN_DIMENSIONS = [5, 1];
const SIMULATION_INPUTS = 5;
const SIMULATION_OUTPUTS = 1;

/**
 * Validate a champion and its score as one record. Older saves without score
 * metadata remain loadable, but never contribute a stale auto-save threshold.
 */
function validateChampionRecord(brain, score, requireScore = false, allowScoreString = false) {
  const network = NeuralNetwork.deserialize(brain);
  if (!network || !NeuralNetwork.isValidArchitecture(
    network.layers.map(layer => layer.length),
    SIMULATION_INPUTS,
    SIMULATION_OUTPUTS
  )) {
    return null;
  }

  const hasScore = score !== null && score !== undefined;
  const validScoreType = typeof score === 'number' ||
    (allowScoreString && typeof score === 'string' && score.trim() !== '');
  const normalizedScore = hasScore && validScoreType ? Number(score) : -Infinity;
  if ((hasScore && (!validScoreType || !Number.isFinite(normalizedScore))) ||
      (requireScore && !Number.isFinite(normalizedScore))) {
    return null;
  }

  return { brain, score: normalizedScore };
}

function loadSavedChampionRecord() {
  try {
    const savedBrain = localStorage.getItem(CHAMPION_STORAGE_KEY);
    if (!savedBrain) return null;
    const score = localStorage.getItem(CHAMPION_BEST_SCORE_KEY);
    return validateChampionRecord(JSON.parse(savedBrain), score, false, true);
  } catch (e) {
    return null;
  }
}

function saveChampionRecord(brain, score) {
  const record = validateChampionRecord(brain, score, true);
  if (!record) return null;

  localStorage.setItem(CHAMPION_STORAGE_KEY, JSON.stringify(record.brain));
  localStorage.setItem(CHAMPION_BEST_SCORE_KEY, String(record.score));
  return record;
}

function App() {
  const [initialSavedChampion] = useState(() => loadSavedChampionRecord());
  const [parameters, setParameters] = useState(() => ({
    numOfBirds: 1000,
    mutationRate: 0.1,
    mutationStrength: 0.1,
    ticksPerFrame: 1,
    bestBird: initialSavedChampion ? initialSavedChampion.brain : null,
    brainDimensions: initialSavedChampion
      ? initialSavedChampion.brain.layers
      : DEFAULT_BRAIN_DIMENSIONS,
  }));
  const [savedBestScore, setSavedBestScore] = useState(
    initialSavedChampion ? initialSavedChampion.score : -Infinity
  );
  const [generationHistory, setGenerationHistory] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [restartCounter, setRestartCounter] = useState(0);
  const [bestBrain, setBestBrain] = useState(null);
  const [hasSavedChampion, setHasSavedChampion] = useState(!!initialSavedChampion);
  const [championStatus, setChampionStatus] = useState('');
  const latestScoreRef = useRef(-Infinity);
  const statusTimeoutRef = useRef(null);

  const showChampionStatus = useCallback((message) => {
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    setChampionStatus(message);
    statusTimeoutRef.current = setTimeout(() => {
      setChampionStatus('');
      statusTimeoutRef.current = null;
    }, 2000);
  }, []);

  useEffect(() => () => {
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
  }, []);

  // Preserve the active champion while applying editable form values. Avoid an
  // unnecessary restart when the normalized values have not changed.
  const handleParamsChange = useCallback((newParams) => {
    const nextParameters = {
      ...parameters,
      ...newParams,
      bestBird: parameters.bestBird,
    };
    const editableKeys = [
      'numOfBirds',
      'mutationRate',
      'mutationStrength',
      'ticksPerFrame',
      'brainDimensions',
    ];
    const changed = editableKeys.some(key =>
      JSON.stringify(nextParameters[key]) !== JSON.stringify(parameters[key])
    );
    if (!changed) return;

    setParameters(nextParameters);
    setRestartCounter(prev => prev + 1);
  }, [parameters]);

  const handleGenerationEnd = useCallback((data) => {
    if (data === null) {
      setGenerationHistory([]);
      setBestBrain(null);
      latestScoreRef.current = -Infinity;
      return;
    }

    setGenerationHistory(prev => [...prev, data]);
    const candidate = validateChampionRecord(data.bestBrain, data.score, true);
    if (!candidate) {
      setBestBrain(null);
      latestScoreRef.current = -Infinity;
      return;
    }

    latestScoreRef.current = candidate.score;
    setBestBrain(candidate.brain);
    if (candidate.score > savedBestScore) {
      try {
        const saved = saveChampionRecord(candidate.brain, candidate.score);
        if (saved) {
          setSavedBestScore(saved.score);
          setHasSavedChampion(true);
        }
      } catch (e) {
        // Storage can be unavailable or full; training should continue.
      }
    }
  }, [savedBestScore]);

  const handleSaveChampion = useCallback(() => {
    try {
      const saved = saveChampionRecord(bestBrain, latestScoreRef.current);
      if (!saved) {
        showChampionStatus('Current champion data is invalid.');
        return;
      }
      setSavedBestScore(saved.score);
      setHasSavedChampion(true);
      showChampionStatus('Champion saved!');
    } catch (e) {
      showChampionStatus('Failed to save champion.');
    }
  }, [bestBrain, showChampionStatus]);

  const handleLoadChampion = useCallback(() => {
    const saved = loadSavedChampionRecord();
    if (!saved) {
      setHasSavedChampion(false);
      setSavedBestScore(-Infinity);
      showChampionStatus('Saved champion data is invalid or incompatible.');
      return;
    }

    setParameters(prev => ({
      ...prev,
      bestBird: saved.brain,
      brainDimensions: saved.brain.layers,
    }));
    setSavedBestScore(saved.score);
    setHasSavedChampion(true);
    setRestartCounter(prev => prev + 1);
    showChampionStatus('Champion loaded!');
  }, [showChampionStatus]);

  const handleClearChampion = useCallback(() => {
    try {
      localStorage.removeItem(CHAMPION_STORAGE_KEY);
      localStorage.removeItem(CHAMPION_BEST_SCORE_KEY);
      setHasSavedChampion(false);
      setSavedBestScore(-Infinity);
      showChampionStatus('Saved champion cleared.');
    } catch (e) {
      showChampionStatus('Failed to clear champion.');
    }
  }, [showChampionStatus]);

  const handleResetTraining = useCallback(() => {
    setGenerationHistory([]);
    setBestBrain(null);
    latestScoreRef.current = -Infinity;
    setRestartCounter(prev => prev + 1);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (key !== 'r' && key !== 'k' && key !== 'l') return;

      const target = event.target;
      const editableTarget = target instanceof Element && target.closest(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
      );
      if (editableTarget) return;

      if (key === 'r') {
        handleResetTraining();
        return;
      }

      const speedChange = key === 'k' ? -1 : 1;
      setParameters(prev => ({
        ...prev,
        ticksPerFrame: Math.min(20, Math.max(1, prev.ticksPerFrame + speedChange)),
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResetTraining]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Neural Network Flappy Bird</h1>
      </header>
      <main className="App-main">
        <div className="Sidebar left">
          <div className="Controls-container">
            <h2>Configuration</h2>
            <ParameterForm parameters={parameters} onChangeParameters={handleParamsChange} />
            <div className="champion-controls">
              <h3>Champion Brain</h3>
              <div className="champion-buttons">
                <button
                  className="champion-btn"
                  onClick={handleSaveChampion}
                  disabled={!bestBrain}
                  type="button"
                  title="Save the best brain from the latest generation"
                >
                  💾 Save Brain
                </button>
                <button
                  className="champion-btn"
                  onClick={handleLoadChampion}
                  disabled={!hasSavedChampion}
                  type="button"
                  title="Load a saved champion brain and restart"
                >
                  📂 Load Champion
                </button>
                <button
                  className="champion-btn"
                  onClick={handleClearChampion}
                  disabled={!hasSavedChampion}
                  type="button"
                  title="Remove saved champion data"
                >
                  🗑️ Clear Saved
                </button>
              </div>
              {championStatus && (
                <span className="champion-status">{championStatus}</span>
              )}
            </div>
          </div>
        </div>

        <div className="Game-container">
          <P5Wrapper
            sketch={sketch}
            parameters={parameters}
            onGenerationEnd={handleGenerationEnd}
            paused={isPaused}
            restartCounter={restartCounter}
          />
          <div className="game-controls-overlay">
            <button
              className="pause-btn"
              onClick={() => setIsPaused(prev => !prev)}
              type="button"
            >
              {isPaused ? 'RESUME' : 'PAUSE'}
            </button>
            <button
              className="reset-btn"
              onClick={handleResetTraining}
              type="button"
              title="Restart training with the current parameters"
            >
              RESET TRAINING
            </button>
          </div>
        </div>

        <div className="Sidebar right">
          <div className="Stats-container">
            <h2>Live Training Stats</h2>
            <TrainingSummary data={generationHistory} />
            <FitnessChart data={generationHistory} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
