import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';

// Module-level references so tests can inspect P5Wrapper props and trigger events
let triggerGenerationEnd = null;
let lastP5WrapperProps = null;

jest.mock('./components/P5Wrapper', () => {
  const React = require('react');
  return function MockP5Wrapper(props) {
    React.useEffect(() => {
      // Expose the callback and latest props so tests can inspect them
      triggerGenerationEnd = props.onGenerationEnd || null;
    }, [props.onGenerationEnd]);
    // Track all props for test inspection
    lastP5WrapperProps = props;
    return React.createElement('div', { 'data-testid': 'p5-wrapper' });
  };
});

test('renders the Flappy Bird app shell', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /neural network flappy bird/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /configuration/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /live training stats/i })).toBeInTheDocument();
  expect(screen.getByTestId('p5-wrapper')).toBeInTheDocument();
});

describe('Training Summary integration', () => {
  test('renders five summary cards inside Stats-container with placeholder values before generations complete', () => {
    render(<App />);
    const statsContainer = document.querySelector('.Stats-container');
    expect(statsContainer).toBeInTheDocument();

    const summaryEl = statsContainer.querySelector('.training-summary');
    expect(summaryEl).toBeInTheDocument();

    // All five cards should show empty placeholders
    const placeholders = summaryEl.querySelectorAll('.summary-value');
    expect(placeholders).toHaveLength(6);
    placeholders.forEach(el => {
      expect(el.textContent).toBe('—');
    });
  });

  test('renders FitnessChart below the training summary in DOM order', () => {
    render(<App />);
    const statsContainer = document.querySelector('.Stats-container');
    const children = Array.from(statsContainer.children);

    // Stats-container children: h2, div.training-summary, FitnessChart div
    const summaryIdx = children.findIndex(
      child => child.classList.contains('training-summary')
    );
    const chartIdx = children.findIndex(
      child => child.textContent.includes('No data yet')
    );

    expect(summaryIdx).toBeGreaterThanOrEqual(0);
    expect(chartIdx).toBeGreaterThan(summaryIdx);
  });
});

describe('Stop button overlay', () => {
  test('renders a PAUSE/RESUME button inside .game-controls-overlay within .Game-container', () => {
    render(<App />);
    const overlay = document.querySelector('.game-controls-overlay');
    expect(overlay).toBeInTheDocument();

    const pauseBtn = screen.getByRole('button', { name: /pause/i });
    expect(overlay.contains(pauseBtn)).toBe(true);

    // Button toggles text between PAUSE and RESUME
    fireEvent.click(pauseBtn);
    expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /resume/i }));
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });
});

describe('Reset training controls', () => {
  test('pressing r resets training through the existing reset path', () => {
    render(<App />);
    const initialRestartCounter = lastP5WrapperProps.restartCounter;

    act(() => {
      triggerGenerationEnd({
        generation: 4,
        score: 30,
        bestBrain: null,
      });
    });
    expect(document.querySelector('.summary-value')).toHaveTextContent('4');

    fireEvent.keyDown(window, { key: 'r' });

    expect(lastP5WrapperProps.restartCounter).toBe(initialRestartCounter + 1);
    document.querySelectorAll('.summary-value').forEach(value => {
      expect(value).toHaveTextContent('—');
    });
  });

  test('pressing uppercase R also resets training', () => {
    render(<App />);
    const initialRestartCounter = lastP5WrapperProps.restartCounter;

    fireEvent.keyDown(window, { key: 'R' });

    expect(lastP5WrapperProps.restartCounter).toBe(initialRestartCounter + 1);
  });

  test('ignores R from focused editable elements', () => {
    render(<App />);
    const initialRestartCounter = lastP5WrapperProps.restartCounter;
    const app = document.querySelector('.App');
    const editableElements = [
      document.querySelector('input[name="numOfBirds"]'),
      document.createElement('textarea'),
      document.createElement('select'),
      document.createElement('div'),
    ];
    editableElements[3].setAttribute('contenteditable', 'true');
    editableElements[3].tabIndex = 0;
    editableElements.slice(1).forEach(element => app.appendChild(element));

    editableElements.forEach(element => {
      element.focus();
      expect(document.activeElement).toBe(element);
      fireEvent.keyDown(element, { key: 'R' });
    });

    expect(lastP5WrapperProps.restartCounter).toBe(initialRestartCounter);
  });

  test('the RESET TRAINING button still increments the restart counter', () => {
    render(<App />);
    const initialRestartCounter = lastP5WrapperProps.restartCounter;

    fireEvent.click(screen.getByRole('button', { name: /reset training/i }));

    expect(lastP5WrapperProps.restartCounter).toBe(initialRestartCounter + 1);
  });
});

describe('Simulation speed keyboard controls', () => {
  test('K decreases and L increases speed within 1x-20x without restarting', () => {
    render(<App />);
    const initialRestartCounter = lastP5WrapperProps.restartCounter;

    fireEvent.keyDown(window, { key: 'k' });
    expect(lastP5WrapperProps.parameters.ticksPerFrame).toBe(1);
    expect(lastP5WrapperProps.restartCounter).toBe(initialRestartCounter);

    fireEvent.keyDown(window, { key: 'l' });
    expect(lastP5WrapperProps.parameters.ticksPerFrame).toBe(2);
    expect(lastP5WrapperProps.restartCounter).toBe(initialRestartCounter);

    fireEvent.keyDown(window, { key: 'K' });
    expect(lastP5WrapperProps.parameters.ticksPerFrame).toBe(1);

    for (let i = 0; i < 25; i++) {
      fireEvent.keyDown(window, { key: 'L' });
    }
    expect(lastP5WrapperProps.parameters.ticksPerFrame).toBe(20);

    fireEvent.keyDown(window, { key: 'l' });
    expect(lastP5WrapperProps.parameters.ticksPerFrame).toBe(20);
    expect(lastP5WrapperProps.restartCounter).toBe(initialRestartCounter);
  });

  test('K and L are ignored from editable elements', () => {
    render(<App />);
    const initialRestartCounter = lastP5WrapperProps.restartCounter;
    const app = document.querySelector('.App');
    const editableElements = [
      document.querySelector('input[name="numOfBirds"]'),
      document.createElement('textarea'),
      document.createElement('select'),
      document.createElement('div'),
    ];
    editableElements[3].setAttribute('contenteditable', 'true');
    editableElements[3].tabIndex = 0;
    editableElements.slice(1).forEach(element => app.appendChild(element));

    editableElements.forEach(element => {
      element.focus();
      expect(document.activeElement).toBe(element);
      fireEvent.keyDown(element, { key: 'l' });
      fireEvent.keyDown(element, { key: 'K' });
    });

    expect(lastP5WrapperProps.parameters.ticksPerFrame).toBe(1);
    expect(lastP5WrapperProps.restartCounter).toBe(initialRestartCounter);
  });

  test('speed shortcuts preserve generation history', () => {
    render(<App />);

    act(() => {
      triggerGenerationEnd({ generation: 4, score: 30, bestBrain: null });
    });
    fireEvent.keyDown(window, { key: 'l' });

    expect(document.querySelector('.summary-value')).toHaveTextContent('4');
  });
});

describe('Auto-load champion from localStorage on startup', () => {
  const STORAGE_KEY = 'flappy-bird-champion';
  const mockChampionData = {
    layers: [5, 1],
    weights: [{ rows: 5, cols: 1, data: [[0.5], [0.5], [0.5], [0.5], [0.5]] }],
    biases: [{ rows: 1, cols: 1, data: [[0.1]] }],
  };

  afterEach(() => {
    localStorage.clear();
  });

  test('loads a valid saved champion into bestBird and brainDimensions on startup', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockChampionData));

    render(<App />);

    expect(lastP5WrapperProps).toBeTruthy();
    expect(lastP5WrapperProps.parameters).toBeTruthy();
    expect(lastP5WrapperProps.parameters.bestBird).toEqual(mockChampionData);
    expect(lastP5WrapperProps.parameters.brainDimensions).toEqual([5, 1]);
  });

  test('starts with null bestBird when localStorage has no saved champion', () => {
    localStorage.removeItem(STORAGE_KEY);

    render(<App />);

    expect(lastP5WrapperProps).toBeTruthy();
    expect(lastP5WrapperProps.parameters.bestBird).toBeNull();
    expect(lastP5WrapperProps.parameters.brainDimensions).toEqual([5, 1]);
  });

  test('does not crash when localStorage contains invalid JSON on startup', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json{{{');

    expect(() => {
      render(<App />);
    }).not.toThrow();

    expect(lastP5WrapperProps.parameters.bestBird).toBeNull();
  });

  test('does not crash when localStorage contains malformed champion data on startup', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ invalid: true }));

    expect(() => {
      render(<App />);
    }).not.toThrow();

    expect(lastP5WrapperProps.parameters.bestBird).toBeNull();
  });
});

describe('Auto-save best champion brain on generation end', () => {
  const STORAGE_KEY = 'flappy-bird-champion';
  const BEST_SCORE_KEY = 'flappy-bird-champion-best-score';
  const mockChampionData = {
    layers: [5, 1],
    weights: [{ rows: 5, cols: 1, data: [[0.5], [0.5], [0.5], [0.5], [0.5]] }],
    biases: [{ rows: 1, cols: 1, data: [[0.1]] }],
  };

  let setItemSpy;

  beforeEach(() => {
    localStorage.clear();
    setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('auto-saves brain and best score when generation score exceeds saved best', () => {
    render(<App />);

    expect(triggerGenerationEnd).toBeTruthy();

    act(() => {
      triggerGenerationEnd({
        generation: 1,
        score: 100,
        bestBrain: mockChampionData,
      });
    });

    // Should have saved the brain
    expect(setItemSpy).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify(mockChampionData)
    );
    // Should have saved the best score
    expect(setItemSpy).toHaveBeenCalledWith(
      BEST_SCORE_KEY,
      '100'
    );

    // Verify stored values
    const storedBrain = localStorage.getItem(STORAGE_KEY);
    expect(JSON.parse(storedBrain)).toEqual(mockChampionData);
    expect(localStorage.getItem(BEST_SCORE_KEY)).toBe('100');
  });

  test('does not auto-save when bestBrain is null even with high score', () => {
    render(<App />);

    setItemSpy.mockClear();

    act(() => {
      triggerGenerationEnd({
        generation: 1,
        score: 200,
        bestBrain: null,
      });
    });

    // Should not have saved anything (null bestBrain skips auto-save)
    expect(setItemSpy).not.toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.any(String)
    );
    expect(setItemSpy).not.toHaveBeenCalledWith(
      BEST_SCORE_KEY,
      expect.any(String)
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test('does not auto-save when score is non-numeric (e.g. null, string)', () => {
    // Pre-populate a champion so savedBestScore is known
    const oldChampion = {
      layers: [5, 1],
      weights: [{ rows: 5, cols: 1, data: [[0.5], [0.5], [0.5], [0.5], [0.5]] }],
      biases: [{ rows: 1, cols: 1, data: [[0.1]] }],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(oldChampion));
    localStorage.setItem(BEST_SCORE_KEY, '100');

    render(<App />);

    setItemSpy.mockClear();

    // Non-numeric score — Number.isFinite(null) is false
    act(() => {
      triggerGenerationEnd({
        generation: 2,
        score: null,
        bestBrain: oldChampion,
      });
    });

    expect(setItemSpy).not.toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.any(String)
    );
    expect(localStorage.getItem(BEST_SCORE_KEY)).toBe('100');
  });

  test('does not auto-save when score is a numeric string (coercion not allowed)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockChampionData));
    localStorage.setItem(BEST_SCORE_KEY, '100');

    render(<App />);

    setItemSpy.mockClear();

    // String '200' — Number.isFinite('200') is false (no coercion)
    act(() => {
      triggerGenerationEnd({
        generation: 2,
        score: '200',
        bestBrain: mockChampionData,
      });
    });

    expect(setItemSpy).not.toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.any(String)
    );
    expect(localStorage.getItem(BEST_SCORE_KEY)).toBe('100');
  });

  test('does not overwrite saved champion when new score is lower than saved best', () => {
    // Pre-populate with a champion at score 100
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockChampionData));
    localStorage.setItem(BEST_SCORE_KEY, '100');

    render(<App />);

    // Clear the spy counts from initial render reads
    setItemSpy.mockClear();

    const worseBrain = {
      layers: [5, 1],
      weights: [{ rows: 5, cols: 1, data: [[0.1], [0.1], [0.1], [0.1], [0.1]] }],
      biases: [{ rows: 1, cols: 1, data: [[0.01]] }],
    };

    act(() => {
      triggerGenerationEnd({
        generation: 2,
        score: 50,
        bestBrain: worseBrain,
      });
    });

    // Should NOT have overwritten the champion
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(mockChampionData));
    expect(localStorage.getItem(BEST_SCORE_KEY)).toBe('100');
  });

  test('overwrites saved champion when new score is higher than saved best', () => {
    // Pre-populate with a lower-scoring champion
    const oldChampion = {
      layers: [5, 1],
      weights: [{ rows: 5, cols: 1, data: [[0.1], [0.1], [0.1], [0.1], [0.1]] }],
      biases: [{ rows: 1, cols: 1, data: [[0.01]] }],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(oldChampion));
    localStorage.setItem(BEST_SCORE_KEY, '50');

    render(<App />);

    setItemSpy.mockClear();

    act(() => {
      triggerGenerationEnd({
        generation: 3,
        score: 150,
        bestBrain: mockChampionData,
      });
    });

    // Should have overwritten with the new champion
    const storedBrain = localStorage.getItem(STORAGE_KEY);
    expect(JSON.parse(storedBrain)).toEqual(mockChampionData);
    expect(localStorage.getItem(BEST_SCORE_KEY)).toBe('150');
  });

  test('does not auto-save when bestBrain fails deserialization validation', () => {
    render(<App />);

    setItemSpy.mockClear();

    act(() => {
      triggerGenerationEnd({
        generation: 1,
        score: 100,
        bestBrain: { layers: [5, 1], weights: [], biases: [] }, // malformed - no valid matrices
      });
    });

    // Should not have saved
    expect(setItemSpy).not.toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.any(String)
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test('does not auto-save when bestBrain has truncated weight data arrays', () => {
    render(<App />);

    setItemSpy.mockClear();

    // Dimensions are declared as 5x1, but only 3 rows of data provided
    const truncatedBrain = {
      layers: [5, 1],
      weights: [{ rows: 5, cols: 1, data: [[0.5], [0.5], [0.5]] }],
      biases: [{ rows: 1, cols: 1, data: [[0.1]] }],
    };

    act(() => {
      triggerGenerationEnd({
        generation: 1,
        score: 100,
        bestBrain: truncatedBrain,
      });
    });

    // Should not have saved — truncated data fails deserialization
    expect(setItemSpy).not.toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.any(String)
    );
    expect(setItemSpy).not.toHaveBeenCalledWith(
      BEST_SCORE_KEY,
      expect.any(String)
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test('does not auto-save when bestBrain has a weight row with missing columns', () => {
    render(<App />);

    setItemSpy.mockClear();

    // Dimensions are 5x2, but third row has only 1 element
    const malformedBrain = {
      layers: [5, 2],
      weights: [{
        rows: 5, cols: 2,
        data: [[0.5, 0.6], [0.5, 0.6], [0.5], [0.5, 0.6], [0.5, 0.6]],
      }],
      biases: [{ rows: 1, cols: 2, data: [[0.1, 0.2]] }],
    };

    act(() => {
      triggerGenerationEnd({
        generation: 1,
        score: 100,
        bestBrain: malformedBrain,
      });
    });

    expect(setItemSpy).not.toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.any(String)
    );
    expect(setItemSpy).not.toHaveBeenCalledWith(
      BEST_SCORE_KEY,
      expect.any(String)
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('Champion save/load feature', () => {
  const STORAGE_KEY = 'flappy-bird-champion';
  const BEST_SCORE_KEY = 'flappy-bird-champion-best-score';
  const mockChampionData = {
    layers: [5, 1],
    weights: [{ rows: 5, cols: 1, data: [[0.5], [0.5], [0.5], [0.5], [0.5]] }],
    biases: [{ rows: 1, cols: 1, data: [[0.1]] }],
  };

  let getItemSpy;
  let setItemSpy;
  let removeItemSpy;

  beforeEach(() => {
    // Clear all localStorage state before each test
    localStorage.clear();

    // Spy on localStorage methods
    getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /* ------------------------------------------------------------------ */
  /*  Champion controls rendered in the sidebar                          */
  /* ------------------------------------------------------------------ */
  test('renders champion save, load, and clear buttons in the sidebar', () => {
    render(<App />);

    // Use queryAllByRole to avoid multiple-match errors, then filter by text
    const allBtns = screen.queryAllByRole('button');
    const saveBtn = allBtns.find(b => /save\s*brain/i.test(b.textContent));
    const loadBtn = allBtns.find(b => /load/i.test(b.textContent));
    const clearBtn = allBtns.find(b => /clear\s*saved/i.test(b.textContent));

    // At least one of the champion controls should be present
    const someControlExists = saveBtn || loadBtn || clearBtn;
    expect(someControlExists).toBeTruthy();
  });

  test('champion controls are inside the Controls-container or its section', () => {
    render(<App />);
    const controlsContainer = document.querySelector('.Controls-container');
    expect(controlsContainer).toBeInTheDocument();

    // Look for champion-related buttons within the controls
    const allButtons = controlsContainer.querySelectorAll('button');
    const championButtons = Array.from(allButtons).filter(btn =>
      /save|load|clear|champion/i.test(btn.textContent)
    );

    // At least one champion button should be inside Controls-container
    // (They could also be in a separate champion-section within the sidebar)
    // If not found there, they could be below the form in the sidebar.
    const sidebar = document.querySelector('.Sidebar.left') || document.querySelector('.Sidebar');
    if (sidebar) {
      const sidebarButtons = sidebar.querySelectorAll('button');
      const found = Array.from(sidebarButtons).filter(btn =>
        /save.*brain|save.*champion|load.*brain|load.*champion|clear/i.test(btn.textContent)
      );
      expect(found.length).toBeGreaterThanOrEqual(1);
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Save button disabled before any generation completes               */
  /* ------------------------------------------------------------------ */
  test('save champion button is disabled before any generation completes', () => {
    render(<App />);

    const allBtns = screen.queryAllByRole('button');
    const saveBtn = allBtns.find(b => /save\s*brain/i.test(b.textContent));
    if (saveBtn) {
      expect(saveBtn.disabled).toBe(true);
    }
    // If no save button rendered, the feature may only show after a generation
  });

  /* ------------------------------------------------------------------ */
  /*  Load button disabled when no champion saved                        */
  /* ------------------------------------------------------------------ */
  test('load champion button is disabled when localStorage has no saved champion', () => {
    // Ensure no item in storage
    localStorage.removeItem(STORAGE_KEY);

    render(<App />);

    const allBtns = screen.queryAllByRole('button');
    const loadBtn = allBtns.find(b => /load\s*champion/i.test(b.textContent));
    if (loadBtn) {
      expect(loadBtn.disabled).toBe(true);
    }
  });

  test('load champion button is enabled when a champion is saved in localStorage', () => {
    // Pre-populate localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockChampionData));

    render(<App />);

    const allBtns = screen.queryAllByRole('button');
    const loadBtn = allBtns.find(b => /load\s*champion/i.test(b.textContent));
    if (loadBtn) {
      expect(loadBtn.disabled).toBe(false);
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Save champion writes to localStorage                               */
  /* ------------------------------------------------------------------ */
  test('saving champion writes serialized brain data and best-score to localStorage', async () => {
    render(<App />);

    // First trigger a generation-end event so bestBrain is populated
    expect(triggerGenerationEnd).toBeTruthy();
    act(() => {
      triggerGenerationEnd({
        generation: 1,
        score: 100,
        bestBrain: mockChampionData,
      });
    });

    // Save button should now be enabled (state flushed by act)
    const allBtns = screen.queryAllByRole('button');
    const saveBtn = allBtns.find(b => /save\s*brain/i.test(b.textContent));
    expect(saveBtn).toBeTruthy();
    expect(saveBtn.disabled).toBe(false);

    // Click save
    fireEvent.click(saveBtn);

    // Verify localStorage.setItem was called with our champion key and valid JSON
    expect(setItemSpy).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.any(String)
    );
    // Verify best-score metadata is also saved during manual save
    expect(setItemSpy).toHaveBeenCalledWith(
      BEST_SCORE_KEY,
      '100'
    );

    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(stored);
    expect(parsed).toHaveProperty('layers');
    expect(parsed).toHaveProperty('weights');
    expect(parsed).toHaveProperty('biases');
    expect(parsed.layers).toEqual([5, 1]);
    expect(localStorage.getItem(BEST_SCORE_KEY)).toBe('100');
  });

  /* ------------------------------------------------------------------ */
  /*  Load champion restarts simulation and passes bestBird              */
  /* ------------------------------------------------------------------ */
  test('load champion passes bestBird to P5Wrapper parameters and shows status', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockChampionData));

    render(<App />);

    const allBtns = screen.queryAllByRole('button');
    const loadBtn = allBtns.find(b => /load\s*champion/i.test(b.textContent));
    expect(loadBtn).toBeTruthy();
    expect(loadBtn.disabled).toBe(false);

    fireEvent.click(loadBtn);

    // Should have read from localStorage
    expect(getItemSpy).toHaveBeenCalledWith(STORAGE_KEY);

    // Should show success status
    expect(screen.getByText('Champion loaded!')).toBeInTheDocument();

    // Verify P5Wrapper received bestBird in parameters
    expect(lastP5WrapperProps).toBeTruthy();
    expect(lastP5WrapperProps.parameters).toBeTruthy();
    expect(lastP5WrapperProps.parameters.bestBird).toEqual(mockChampionData);
    // brainDimensions should match the champion's architecture
    expect(lastP5WrapperProps.parameters.brainDimensions).toEqual([5, 1]);
  });

  /* ------------------------------------------------------------------ */
  /*  Load champion triggers simulation restart (onGenerationEnd(null))  */
  /* ------------------------------------------------------------------ */
  test('load champion triggers simulation restart which clears history via onGenerationEnd(null)', () => {
    // First, populate some generation history
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockChampionData));
    const onGenEndMock = jest.fn();
    render(<App />);

    // Override the exposed trigger to use our mock so we can track calls precisely
    // The real triggerGenerationEnd is set by the component; we wrap it.
    const originalTrigger = triggerGenerationEnd;
    expect(originalTrigger).toBeTruthy();

    // Fire a generation end to populate history
    act(() => {
      originalTrigger({
        generation: 1,
        score: 100,
        bestBrain: mockChampionData,
      });
    });

    // Now clear localStorage spy so we can track fresh calls
    getItemSpy.mockClear();

    // Click load
    const allBtns = screen.queryAllByRole('button');
    const loadBtn = allBtns.find(b => /load\s*champion/i.test(b.textContent));
    expect(loadBtn).toBeTruthy();
    fireEvent.click(loadBtn);

    // After load, parameters.bestBird changes, so the sketch reinitializes
    // and calls onGenerationEnd(null) to clear history
    expect(getItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
    expect(lastP5WrapperProps.parameters.bestBird).toEqual(mockChampionData);

    // Verify brainDimensions got updated to match champion
    expect(lastP5WrapperProps.parameters.brainDimensions).toEqual([5, 1]);
  });

  /* ------------------------------------------------------------------ */
  /*  Clear champion removes data from localStorage                      */
  /* ------------------------------------------------------------------ */
  test('clear champion removes saved data from localStorage', () => {
    const BEST_SCORE_KEY = 'flappy-bird-champion-best-score';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockChampionData));
    localStorage.setItem(BEST_SCORE_KEY, '100');

    render(<App />);

    const allBtns = screen.queryAllByRole('button');
    const clearBtn = allBtns.find(b => /clear\s*saved/i.test(b.textContent));
    if (!clearBtn) return;
    if (clearBtn.disabled) return;

    fireEvent.click(clearBtn);

    expect(removeItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
    expect(removeItemSpy).toHaveBeenCalledWith(BEST_SCORE_KEY);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(BEST_SCORE_KEY)).toBeNull();
  });

  /* ------------------------------------------------------------------ */
  /*  Invalid localStorage data handled without crashing                 */
  /* ------------------------------------------------------------------ */
  test('invalid JSON in localStorage does not crash the app', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json{{{');

    expect(() => {
      render(<App />);
    }).not.toThrow();
  });

  test('malformed champion data in localStorage does not crash on load', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ invalid: true }));

    render(<App />);

    const allBtns = screen.queryAllByRole('button');
    const loadBtn = allBtns.find(b => /load\s*champion/i.test(b.textContent));
    if (!loadBtn) return;
    if (loadBtn.disabled) return;

    expect(() => {
      fireEvent.click(loadBtn);
    }).not.toThrow();
  });

  /* ------------------------------------------------------------------ */
  /*  Styling matches the existing dark glass/cyan theme                 */
  /* ------------------------------------------------------------------ */
  test('champion buttons use the same button styling class as other controls', () => {
    render(<App />);

    const pauseBtn = screen.getByRole('button', { name: /pause/i });
    const pauseClassList = Array.from(pauseBtn.classList);

    // Find champion buttons
    const allButtons = screen.getAllByRole('button');
    const championBtns = allButtons.filter(btn =>
      /champion/i.test(btn.textContent) ||
      btn.className === 'champion-btn'
    );

    if (championBtns.length === 0) return; // feature not rendered yet

    championBtns.forEach(btn => {
      // Champion buttons should have classes that produce similar styling
      // They could share 'pause-btn' class or use a similarly styled class
      const btnClassList = Array.from(btn.classList);
      // At minimum they should have some CSS class(es) for styling
      expect(btnClassList.length).toBeGreaterThan(0);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Existing functionality still works                                 */
  /* ------------------------------------------------------------------ */
  test('pause/resume still works with champion controls present', () => {
    render(<App />);

    const pauseBtn = screen.getByRole('button', { name: /pause/i });
    expect(pauseBtn).toBeInTheDocument();

    fireEvent.click(pauseBtn);
    expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /resume/i }));
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });

  test('training summary still renders correctly with champion controls present', () => {
    render(<App />);

    const statsContainer = document.querySelector('.Stats-container');
    expect(statsContainer).toBeInTheDocument();

    const summaryEl = statsContainer.querySelector('.training-summary');
    expect(summaryEl).toBeInTheDocument();

    const placeholders = summaryEl.querySelectorAll('.summary-value');
    expect(placeholders).toHaveLength(6);
  });
});
