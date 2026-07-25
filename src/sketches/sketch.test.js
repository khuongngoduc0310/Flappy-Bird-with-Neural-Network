/**
 * Tests for the p5 sketch's pause and parameter update behavior.
 * The sketch is tested via its public interface: updateWithProps.
 *
 * Because the sketch runs inside p5 instance mode, we provide a minimal mock p5
 * that records key method calls so we can verify behavior.
 */

import NeuralNetwork from '../NeuralNet/nn';
import Bird from '../objects/bird';
import { breedPopulation } from './sketch';

// Mock image imports so preload does not fail
jest.mock('../img/bird.png', () => 'bird.png');
jest.mock('../img/pipe.png', () => 'pipe.png');

/**
 * Helper: create a base mock p5 object with common properties.
 * Each describe block can further customize it.
 */
function createBaseMockP5() {
  const callLog = { noLoop: [], loop: [], background: [], text: [], image: [] };

  return {
    _callLog: callLog,
    CENTER: 'center',
    PI: 3.14159,

    loadImage: jest.fn(() => ({})),
    createCanvas: jest.fn(),
    frameRate: jest.fn(),
    frameCount: 0,

    noLoop: jest.fn(() => { callLog.noLoop.push('called'); }),
    loop: jest.fn(() => { callLog.loop.push('called'); }),

    background: jest.fn(() => { callLog.background.push('called'); }),
    text: jest.fn(() => { callLog.text.push('called'); }),
    textSize: jest.fn(),
    textAlign: jest.fn(),

    fill: jest.fn(),
    stroke: jest.fn(),
    strokeWeight: jest.fn(),
    noStroke: jest.fn(),
    ellipse: jest.fn(),
    rect: jest.fn(),
    line: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    scale: jest.fn(),
    image: jest.fn(() => { callLog.image.push('called'); }),
    imageMode: jest.fn(),

    map: jest.fn((val) => val),
    random: jest.fn(() => 0.5),
  };
}

/**
 * Wrap the sketch's draw function so that frameCount auto-increments
 * on each call (as it does in real p5). Must be called after the sketch
 * has been instantiated (so p.draw is set).
 */
function wrapDraw(mockP5) {
  const originalDraw = mockP5.draw;
  if (typeof originalDraw === 'function') {
    mockP5.draw = jest.fn(() => {
      mockP5.frameCount++;
      originalDraw.call(mockP5);
    });
  }
}

describe('breedPopulation', () => {
  function createSurvivor(value) {
    const bird = new Bird(100, 200);
    const brain = new NeuralNetwork([5, 1]);
    brain.weights[0].fill(value);
    brain.biases[0].fill(value);
    bird.setBrain(brain);
    return bird;
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('preserves an exact independent copy of the top survivor as the elite', () => {
    const elite = createSurvivor(0.75);
    const other = createSurvivor(-0.5);

    const nextGeneration = breedPopulation([elite, other], 3, 0.2, 0.4);

    expect(nextGeneration).toHaveLength(3);
    expect(nextGeneration[0].brain).not.toBe(elite.brain);
    expect(nextGeneration[0].brain.serialize()).toEqual(elite.brain.serialize());
  });

  test('crosses distinct parents and forwards mutation rate and strength', () => {
    const survivors = [createSurvivor(0.1), createSurvivor(0.5), createSurvivor(0.9)];
    const crossoverSpy = jest.spyOn(NeuralNetwork, 'crossover');
    const mutateSpy = jest.spyOn(NeuralNetwork.prototype, 'mutate');

    breedPopulation(survivors, 4, 0.23, 0.47);

    expect(crossoverSpy).toHaveBeenCalledTimes(3);
    crossoverSpy.mock.calls.forEach(([parentA, parentB]) => {
      expect(parentA).not.toBe(parentB);
    });
    expect(mutateSpy).toHaveBeenCalledTimes(3);
    mutateSpy.mock.calls.forEach(([rate, strength]) => {
      expect(rate).toBe(0.23);
      expect(strength).toBe(0.47);
    });
  });

  test.each([2, 3])('creates the requested small population of %i birds', (populationSize) => {
    const survivors = [createSurvivor(0.1), createSurvivor(0.9)];
    expect(breedPopulation(survivors, populationSize, 0, 0)).toHaveLength(populationSize);
  });
});

describe('sketch pause behavior', () => {
  let mockP5;
  let sketchFactory;

  beforeEach(() => {
    mockP5 = createBaseMockP5();

    // Reset the module so each test gets a fresh sketch instance
    jest.resetModules();

    sketchFactory = require('./sketch').default;
    sketchFactory(mockP5);
    if (mockP5.preload) mockP5.preload();
    if (mockP5.setup) mockP5.setup();

    // Wrap draw to auto-increment frameCount
    wrapDraw(mockP5);
  });

  test('paused=true calls noLoop', () => {
    mockP5.updateWithProps({ paused: true });
    expect(mockP5.noLoop).toHaveBeenCalled();
  });

  test('paused=false calls loop', () => {
    mockP5.updateWithProps({ paused: false });
    expect(mockP5.loop).toHaveBeenCalled();
  });

  test('paused=true then false resumes the loop', () => {
    mockP5.updateWithProps({ paused: true });
    expect(mockP5.noLoop).toHaveBeenCalledTimes(1);

    mockP5.updateWithProps({ paused: false });
    expect(mockP5.loop).toHaveBeenCalledTimes(1);
  });

  test('restartCounter increment does not interfere with pause behavior', () => {
    const onGenEnd = jest.fn();
    const params = {
      numOfBirds: 10,
      mutationRate: 0.1,
      mutationStrength: 0.1,
      ticksPerFrame: 1,
      brainDimensions: [5, 1],
    };

    // Initialize
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: params,
      paused: false,
      restartCounter: 0,
    });

    onGenEnd.mockClear();

    // Run some frames
    mockP5.draw();
    mockP5.draw();
    expect(mockP5.frameCount).toBeGreaterThan(0);

    // Pause (no restartCounter change)
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: params,
      paused: true,
      restartCounter: 0,
    });

    expect(mockP5.noLoop).toHaveBeenCalled();
    expect(onGenEnd).not.toHaveBeenCalled();
  });

  test('paused prop alone does not trigger re-initialization', () => {
    const onGenEnd = jest.fn();
    mockP5.updateWithProps({ onGenerationEnd: onGenEnd, paused: true });
    // No parameters change -> no reinit -> onGenEnd(null) is NOT called
    expect(onGenEnd).not.toHaveBeenCalled();
  });

  /* ------------------------------------------------------------------ */
  /*  Pause does not reset simulation state                              */
  /* ------------------------------------------------------------------ */
  test('pause after initialization does not reset frameCount', () => {
    const onGenEnd = jest.fn();

    // Initialize with parameters (this calls initialize, which sets frameCount=0)
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
      },
      paused: false,
    });

    // frameCount starts at 0 after initialize
    expect(mockP5.frameCount).toBe(0);

    // Run a few frames to advance frameCount
    mockP5.draw();
    const frameAfterDraw = mockP5.frameCount;
    expect(frameAfterDraw).toBeGreaterThan(0);

    // Pause — should NOT reset frameCount
    mockP5.updateWithProps({ paused: true });
    expect(mockP5.frameCount).toBe(frameAfterDraw);

    // Resume — frameCount should still be preserved
    mockP5.updateWithProps({ paused: false });
    expect(mockP5.frameCount).toBe(frameAfterDraw);
  });

  test('pause after initialization does not call onGenerationEnd(null) again', () => {
    const onGenEnd = jest.fn();

    // Initialize with parameters (this calls initialize, which calls onGenEnd(null))
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
      },
      paused: false,
    });

    // Clear the null call from initialization
    onGenEnd.mockClear();

    // Toggle pause — should NOT call onGenEnd(null) again
    mockP5.updateWithProps({ paused: true });
    expect(onGenEnd).not.toHaveBeenCalled();

    // Toggle resume — should NOT call onGenEnd(null) again
    mockP5.updateWithProps({ paused: false });
    expect(onGenEnd).not.toHaveBeenCalled();
  });

  /* ------------------------------------------------------------------ */
  /*  Parameter change detection — same params do NOT reinitialize       */
  /* ------------------------------------------------------------------ */
  test('same parameters do not reinitialize (frameCount preserved)', () => {
    const onGenEnd = jest.fn();
    const params = {
      numOfBirds: 10,
      mutationRate: 0.1,
      mutationStrength: 0.1,
      ticksPerFrame: 1,
      brainDimensions: [5, 1],
    };

    // First initialization
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: params,
      paused: false,
    });

    expect(mockP5.frameCount).toBe(0);
    onGenEnd.mockClear();

    // Run a few frames
    mockP5.draw();
    mockP5.draw();
    const frameAfterDraws = mockP5.frameCount;
    expect(frameAfterDraws).toBeGreaterThan(0);

    // Pass the same parameters again — should NOT reinitialize
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: params,
      paused: false,
    });

    // frameCount should be preserved (not reset to 0)
    expect(mockP5.frameCount).toBe(frameAfterDraws);
    // onGenEnd(null) should NOT have been called again
    expect(onGenEnd).not.toHaveBeenCalled();
  });

  /* ------------------------------------------------------------------ */
  /*  Parameter change detection — changed params DO reinitialize        */
  /* ------------------------------------------------------------------ */
  test('changed numOfBirds reinitializes the simulation', () => {
    const onGenEnd = jest.fn();

    // First initialization
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
      },
      paused: false,
    });

    onGenEnd.mockClear();

    // Run a few frames
    mockP5.draw();
    mockP5.draw();
    expect(mockP5.frameCount).toBeGreaterThan(0);

    // Change numOfBirds — should reinitialize
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 20,  // changed
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
      },
      paused: false,
    });

    expect(mockP5.frameCount).toBe(0);
    expect(onGenEnd).toHaveBeenCalledWith(null);
  });

  test('changed mutationRate reinitializes the simulation', () => {
    const onGenEnd = jest.fn();

    // First initialization
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
      },
      paused: false,
    });

    onGenEnd.mockClear();

    mockP5.draw();
    mockP5.draw();
    expect(mockP5.frameCount).toBeGreaterThan(0);

    // Change mutationRate — should reinitialize
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.5,  // changed
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
      },
      paused: false,
    });

    expect(mockP5.frameCount).toBe(0);
    expect(onGenEnd).toHaveBeenCalledWith(null);
  });

  test('changed mutationStrength reinitializes the simulation', () => {
    const onGenEnd = jest.fn();

    // First initialization
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
      },
      paused: false,
    });

    onGenEnd.mockClear();

    mockP5.draw();
    mockP5.draw();
    expect(mockP5.frameCount).toBeGreaterThan(0);

    // Change mutationStrength — should reinitialize
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.5,  // changed
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
      },
      paused: false,
    });

    expect(mockP5.frameCount).toBe(0);
    expect(onGenEnd).toHaveBeenCalledWith(null);
  });

  test('changed ticksPerFrame updates speed without reinitializing the simulation', () => {
    const onGenEnd = jest.fn();

    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
      },
      paused: false,
    });

    onGenEnd.mockClear();
    mockP5.draw();
    mockP5.draw();
    const frameAfterDraws = mockP5.frameCount;
    const noLoopCalls = mockP5.noLoop.mock.calls.length;

    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 5,
        brainDimensions: [5, 1],
      },
      paused: false,
    });

    expect(mockP5.frameCount).toBe(frameAfterDraws);
    expect(mockP5.noLoop).toHaveBeenCalledTimes(noLoopCalls);
    expect(onGenEnd).not.toHaveBeenCalled();

    mockP5.text.mockClear();
    mockP5.draw();
    expect(mockP5.text).toHaveBeenCalledWith('Speed: 5x', 560, 20);
  });

  test('changed brainDimensions reinitializes the simulation', () => {
    const onGenEnd = jest.fn();

    // First initialization
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
      },
      paused: false,
    });

    onGenEnd.mockClear();

    // Run a few frames
    mockP5.draw();
    mockP5.draw();
    expect(mockP5.frameCount).toBeGreaterThan(0);

    // Change brainDimensions — should reinitialize
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 8, 1],  // changed
      },
      paused: false,
    });

    expect(mockP5.frameCount).toBe(0);
    expect(onGenEnd).toHaveBeenCalledWith(null);
  });

  test('restartCounter increment triggers reinitialization even when parameters are identical', () => {
    const onGenEnd = jest.fn();
    const params = {
      numOfBirds: 10,
      mutationRate: 0.1,
      mutationStrength: 0.1,
      ticksPerFrame: 1,
      brainDimensions: [5, 1],
    };

    // First initialization
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: params,
      paused: false,
      restartCounter: 0,
    });

    expect(mockP5.frameCount).toBe(0);
    onGenEnd.mockClear();

    // Run a few frames
    mockP5.draw();
    mockP5.draw();
    const frameAfterDraws = mockP5.frameCount;
    expect(frameAfterDraws).toBeGreaterThan(0);

    // Same params but restartCounter incremented — simulates Load Champion with identical data
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: params,
      paused: false,
      restartCounter: 1,
    });

    // Should reinitialize (frameCount reset)
    expect(mockP5.frameCount).toBe(0);
    expect(onGenEnd).toHaveBeenCalledWith(null);
  });

  test('changed bestBird reinitializes the simulation', () => {
    const onGenEnd = jest.fn();
    const champion1 = {
      layers: [5, 1],
      weights: [{ rows: 5, cols: 1, data: [[0.5], [0.5], [0.5], [0.5], [0.5]] }],
      biases: [{ rows: 1, cols: 1, data: [[0.1]] }],
    };
    const champion2 = {
      layers: [5, 1],
      weights: [{ rows: 5, cols: 1, data: [[0.9], [0.9], [0.9], [0.9], [0.9]] }],
      biases: [{ rows: 1, cols: 1, data: [[0.5]] }],
    };

    // Initialize with first champion
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
        bestBird: champion1,
      },
      paused: false,
    });

    onGenEnd.mockClear();

    // Run a few frames
    mockP5.draw();
    mockP5.draw();
    expect(mockP5.frameCount).toBeGreaterThan(0);

    // Change bestBird — should reinitialize
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
        bestBird: champion2,
      },
      paused: false,
    });

    expect(mockP5.frameCount).toBe(0);
    expect(onGenEnd).toHaveBeenCalledWith(null);
  });

  /* ------------------------------------------------------------------ */
  /*  Pause/resume still works after parameter changes                   */
  /* ------------------------------------------------------------------ */
  test('pause/resume still works after parameter change reinitialization', () => {
    const onGenEnd = jest.fn();

    // Initialize with parameters
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
      },
      paused: false,
    });

    onGenEnd.mockClear();

    // Run some frames
    for (let i = 0; i < 3; i++) {
      mockP5.draw();
    }

    // Pause
    mockP5.updateWithProps({ paused: true });
    expect(mockP5.noLoop).toHaveBeenCalled();
    expect(mockP5.frameCount).toBeGreaterThan(0);

    // Resume
    mockP5.updateWithProps({ paused: false });
    expect(mockP5.loop).toHaveBeenCalled();
    expect(mockP5.frameCount).toBeGreaterThan(0);
  });
});

describe('sketch bestBrain / champion seeding', () => {
  let mockP5;
  let sketchFactory;
  let mathRandomSpy;

  beforeEach(() => {
    mockP5 = createBaseMockP5();

    // Mock Math.random to return 0.25 consistently, producing negative weights
    // (0.25 * 2 - 1 = -0.5), so predictions stay below 0.5 and birds never flap.
    // This ensures birds fall to the ground quickly (~35 frames).
    mathRandomSpy = jest.spyOn(global.Math, 'random').mockReturnValue(0.25);

    jest.resetModules();
    sketchFactory = require('./sketch').default;
    sketchFactory(mockP5);
    if (mockP5.preload) mockP5.preload();
    if (mockP5.setup) mockP5.setup();

    // Wrap draw to auto-increment frameCount (needed for simulation to track progress)
    wrapDraw(mockP5);
  });

  afterEach(() => {
    if (mathRandomSpy) mathRandomSpy.mockRestore();
  });

  /* ------------------------------------------------------------------ */
  /*  Generation-end callback includes bestBrain                         */
  /* ------------------------------------------------------------------ */
  test('onGenerationEnd fires with generation data when all birds die', () => {
    const onGenEnd = jest.fn();

    // Initialize the sketch with birds
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
      },
      paused: false,
    });

    onGenEnd.mockClear(); // clear the null from initialization

    // Call draw repeatedly until all birds die from falling
    // With gravity=0.6, birds at y=200 should hit ground (y >= 580) within ~50 frames
    for (let i = 0; i < 200; i++) {
      mockP5.draw();
    }

    // Check that onGenerationEnd was called with generation data at least once
    const genCalls = onGenEnd.mock.calls.filter(args => args[0] !== null);
    expect(genCalls.length).toBeGreaterThan(0);

    const data = genCalls[0][0];
    expect(data).toHaveProperty('generation');
    expect(data).toHaveProperty('score');
    expect(data).toHaveProperty('bestBrain');
    expect(data.bestBrain).toHaveProperty('layers');
    expect(data.bestBrain).toHaveProperty('weights');
    expect(data.bestBrain).toHaveProperty('biases');
  });

  test('generation-end bestBrain matches the expected network architecture', () => {
    const onGenEnd = jest.fn();

    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
      },
      paused: false,
    });

    onGenEnd.mockClear();

    // Run the simulation until a generation completes
    for (let i = 0; i < 200; i++) {
      mockP5.draw();
    }

    const genCalls = onGenEnd.mock.calls.filter(args => args[0] !== null);
    expect(genCalls.length).toBeGreaterThan(0);

    const data = genCalls[0][0];

    // Verify the serialized brain has the expected layer dimensions
    expect(data.bestBrain.layers).toEqual([5, 1]);

    // Verify weight shapes
    expect(data.bestBrain.weights.length).toBe(1);
    expect(data.bestBrain.weights[0].rows).toBe(5);
    expect(data.bestBrain.weights[0].cols).toBe(1);
    expect(data.bestBrain.weights[0].data.length).toBe(5);

    // Verify bias shapes
    expect(data.bestBrain.biases.length).toBe(1);
    expect(data.bestBrain.biases[0].rows).toBe(1);
    expect(data.bestBrain.biases[0].cols).toBe(1);
  });

  /* ------------------------------------------------------------------ */
  /*  parameters.bestBird seeds the population                           */
  /* ------------------------------------------------------------------ */
  test('when parameters.bestBird is provided, simulation runs to completion and yields valid generation data', () => {
    const onGenEnd = jest.fn();
    const serializedBrain = {
      layers: [5, 1],
      weights: [
        { rows: 5, cols: 1, data: [[0.5], [0.5], [0.5], [0.5], [0.5]] },
      ],
      biases: [
        { rows: 1, cols: 1, data: [[0.1]] },
      ],
    };

    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
        bestBird: serializedBrain,
      },
      paused: false,
    });

    onGenEnd.mockClear();

    // Run simulation until a generation completes
    for (let i = 0; i < 200; i++) {
      mockP5.draw();
    }

    // Verify a generation completed and bestBird's architecture is preserved
    const genCalls = onGenEnd.mock.calls.filter(args => args[0] !== null);
    expect(genCalls.length).toBeGreaterThan(0);
    const data = genCalls[0][0];
    expect(data.generation).toBe(1);
    expect(data.score).toBeGreaterThanOrEqual(0);
    expect(data.bestBrain.layers).toEqual([5, 1]);
  });

  test('first bird receives an exact copy of the champion brain (same weights and biases)', () => {
    const onGenEnd = jest.fn();
    const championWeights = [
      { rows: 5, cols: 1, data: [[0.5], [0.5], [0.5], [0.5], [0.5]] },
    ];
    const championBiases = [
      { rows: 1, cols: 1, data: [[0.1]] },
    ];
    const serializedBrain = {
      layers: [5, 1],
      weights: championWeights,
      biases: championBiases,
    };

    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
        bestBird: serializedBrain,
      },
      paused: false,
    });

    onGenEnd.mockClear();

    // Run simulation to completion
    for (let i = 0; i < 200; i++) {
      mockP5.draw();
    }

    const genCalls = onGenEnd.mock.calls.filter(args => args[0] !== null);
    expect(genCalls.length).toBeGreaterThan(0);
    const data = genCalls[0][0];

    // The bestBrain at generation end should have the exact same weight values
    // as the seeded champion because elitism preserves the champion brain.
    // With Math.random mocked at 0.25, no mutation occurs (0.25 > 0.1 rate),
    // so all birds are identical to the champion, and the best bird's brain
    // is a copy of the champion.
    expect(data.bestBrain.weights.length).toBe(championWeights.length);
    for (let i = 0; i < championWeights.length; i++) {
      expect(data.bestBrain.weights[i].rows).toBe(championWeights[i].rows);
      expect(data.bestBrain.weights[i].cols).toBe(championWeights[i].cols);
      for (let r = 0; r < championWeights[i].rows; r++) {
        for (let c = 0; c < championWeights[i].cols; c++) {
          expect(data.bestBrain.weights[i].data[r][c]).toBe(championWeights[i].data[r][c]);
        }
      }
    }

    // Same for biases
    expect(data.bestBrain.biases.length).toBe(championBiases.length);
    for (let i = 0; i < championBiases.length; i++) {
      expect(data.bestBrain.biases[i].rows).toBe(championBiases[i].rows);
      expect(data.bestBrain.biases[i].cols).toBe(championBiases[i].cols);
      for (let r = 0; r < championBiases[i].rows; r++) {
        for (let c = 0; c < championBiases[i].cols; c++) {
          expect(data.bestBrain.biases[i].data[r][c]).toBe(championBiases[i].data[r][c]);
        }
      }
    }
  });

  test('when champion architecture mismatches brainDimensions, simulation falls back to random initialization', () => {
    const onGenEnd = jest.fn();
    const serializedBrain = {
      layers: [5, 1],
      weights: [
        { rows: 5, cols: 1, data: [[0.5], [0.5], [0.5], [0.5], [0.5]] },
      ],
      biases: [
        { rows: 1, cols: 1, data: [[0.1]] },
      ],
    };

    // brainDimensions is [5, 8, 1] but champion is [5, 1] — mismatch
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 8, 1],
        bestBird: serializedBrain,
      },
      paused: false,
    });

    onGenEnd.mockClear();

    for (let i = 0; i < 200; i++) {
      mockP5.draw();
    }

    const genCalls = onGenEnd.mock.calls.filter(args => args[0] !== null);
    expect(genCalls.length).toBeGreaterThan(0);
    const data = genCalls[0][0];

    // The generation-end bestBrain should have layers [5, 8, 1] (random init),
    // NOT [5, 1] (the champion architecture)
    expect(data.bestBrain.layers).toEqual([5, 8, 1]);
  });

  test('rejects a structurally valid champion with an incompatible input count', () => {
    const onGenEnd = jest.fn();
    const incompatibleBrain = {
      layers: [4, 1],
      weights: [{ rows: 4, cols: 1, data: [[0.5], [0.5], [0.5], [0.5]] }],
      biases: [{ rows: 1, cols: 1, data: [[0.1]] }],
    };

    expect(() => mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 2,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [4, 1],
        bestBird: incompatibleBrain,
      },
      paused: false,
    })).not.toThrow();

    onGenEnd.mockClear();
    for (let i = 0; i < 200; i++) {
      expect(() => mockP5.draw()).not.toThrow();
    }

    const genCalls = onGenEnd.mock.calls.filter(args => args[0] !== null);
    expect(genCalls.length).toBeGreaterThan(0);
    expect(genCalls[0][0].bestBrain.layers).toEqual([5, 1]);
  });

  test('when parameters.bestBird is null, simulation starts and completes normally', () => {
    const onGenEnd = jest.fn();

    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
        bestBird: null,
      },
      paused: false,
    });

    onGenEnd.mockClear();

    for (let i = 0; i < 200; i++) {
      mockP5.draw();
    }

    const genCalls = onGenEnd.mock.calls.filter(args => args[0] !== null);
    expect(genCalls.length).toBeGreaterThan(0);
    expect(genCalls[0][0].generation).toBe(1);
  });

  test('when parameters.bestBird is undefined, simulation starts and completes normally', () => {
    const onGenEnd = jest.fn();

    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
      },
      // no bestBird
      paused: false,
    });

    onGenEnd.mockClear();

    for (let i = 0; i < 200; i++) {
      mockP5.draw();
    }

    const genCalls = onGenEnd.mock.calls.filter(args => args[0] !== null);
    expect(genCalls.length).toBeGreaterThan(0);
    expect(genCalls[0][0].generation).toBe(1);
  });

  test('when parameters.bestBird is malformed, simulation falls back to random initialization and completes normally', () => {
    const onGenEnd = jest.fn();

    // Malformed: missing weights (deserialize returns null, sketch falls back to random)
    const badBrain = { layers: [5, 1], weights: [], biases: [] };

    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
        bestBird: badBrain,
      },
      paused: false,
    });

    onGenEnd.mockClear();

    for (let i = 0; i < 200; i++) {
      mockP5.draw();
    }

    const genCalls = onGenEnd.mock.calls.filter(args => args[0] !== null);
    expect(genCalls.length).toBeGreaterThan(0);
    expect(genCalls[0][0].generation).toBe(1);
  });

  /* ------------------------------------------------------------------ */
  /*  Pause / resume still works after seeding                           */
  /* ------------------------------------------------------------------ */
  test('pause still works after initializing with bestBird', () => {
    const onGenEnd = jest.fn();
    const serializedBrain = {
      layers: [5, 1],
      weights: [
        { rows: 5, cols: 1, data: [[0.5], [0.5], [0.5], [0.5], [0.5]] },
      ],
      biases: [
        { rows: 1, cols: 1, data: [[0.1]] },
      ],
    };

    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 100,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
        bestBird: serializedBrain,
      },
      paused: false,
    });

    // Now pause
    mockP5.updateWithProps({ paused: true });
    expect(mockP5.noLoop).toHaveBeenCalled();

    // Then resume
    mockP5.updateWithProps({ paused: false });
    expect(mockP5.loop).toHaveBeenCalled();
  });
});

describe('sketch GA breeding loop / multi-generation', () => {
  let mockP5;
  let sketchFactory;
  let mathRandomSpy;

  beforeEach(() => {
    mockP5 = createBaseMockP5();

    // Mock Math.random to return 0.25 consistently.
    // This produces negative weights (0.25*2-1 = -0.5) so predictions stay below
    // 0.5, birds never flap, and fall to ground within ~36 frames.
    mathRandomSpy = jest.spyOn(global.Math, 'random').mockReturnValue(0.25);

    jest.resetModules();
    sketchFactory = require('./sketch').default;
    sketchFactory(mockP5);
    if (mockP5.preload) mockP5.preload();
    if (mockP5.setup) mockP5.setup();

    wrapDraw(mockP5);
  });

  afterEach(() => {
    if (mathRandomSpy) mathRandomSpy.mockRestore();
  });

  /* ------------------------------------------------------------------ */
  /*  Generation counter increments across generations                   */
  /* ------------------------------------------------------------------ */
  test('generation counter increments after all birds die and reset', () => {
    const onGenEnd = jest.fn();

    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
      },
      paused: false,
    });

    // Clear the null call from initialization
    onGenEnd.mockClear();

    // Run enough frames for at least 3 full generations
    // ~36 frames/gen * 3 = ~108 frames, use 400 for safety
    for (let i = 0; i < 400; i++) {
      mockP5.draw();
    }

    // Filter out null calls (initialization/resets)
    const genCalls = onGenEnd.mock.calls
      .filter(args => args[0] !== null)
      .map(args => args[0]);

    // Should have completed multiple generations
    expect(genCalls.length).toBeGreaterThanOrEqual(3);

    // Generation numbers should be sequential and increasing
    for (let i = 1; i < genCalls.length; i++) {
      expect(genCalls[i].generation).toBeGreaterThan(genCalls[i - 1].generation);
    }
  });

  test('each generation fires onGenerationEnd with valid generation, score, and bestBrain', () => {
    const onGenEnd = jest.fn();

    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
      },
      paused: false,
    });

    onGenEnd.mockClear();

    for (let i = 0; i < 400; i++) {
      mockP5.draw();
    }

    const genCalls = onGenEnd.mock.calls
      .filter(args => args[0] !== null)
      .map(args => args[0]);

    expect(genCalls.length).toBeGreaterThanOrEqual(2);

    genCalls.forEach((data, idx) => {
      expect(data).toHaveProperty('generation');
      expect(data).toHaveProperty('score');
      expect(data).toHaveProperty('bestBrain');
      expect(typeof data.generation).toBe('number');
      expect(typeof data.score).toBe('number');
      expect(Number.isInteger(data.generation)).toBe(true);
      expect(data.generation).toBeGreaterThanOrEqual(1);
      expect(data.score).toBeGreaterThanOrEqual(0);
      expect(data.bestBrain.layers).toEqual([5, 1]);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  GA breeding preserves top bird via elitism                         */
  /* ------------------------------------------------------------------ */
  test('elitism preserves the best brain weight values across generations', () => {
    const onGenEnd = jest.fn();

    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
      },
      paused: false,
    });

    onGenEnd.mockClear();

    // Run enough frames for multiple generations
    for (let i = 0; i < 600; i++) {
      mockP5.draw();
    }

    const genCalls = onGenEnd.mock.calls
      .filter(args => args[0] !== null)
      .map(args => args[0]);

    expect(genCalls.length).toBeGreaterThanOrEqual(2);

    // With Math.random fixed at 0.25 and mutation rate 0.1 (0.25 > 0.1),
    // no mutation fires. Compare values, not just matrix shapes.
    const firstBrain = genCalls[0].bestBrain;
    for (let g = 1; g < genCalls.length; g++) {
      const nextBrain = genCalls[g].bestBrain;
      expect(nextBrain.layers).toEqual(firstBrain.layers);
      expect(nextBrain.weights).toEqual(firstBrain.weights);
      expect(nextBrain.biases).toEqual(firstBrain.biases);
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Survivor count respects minimum of 2                               */
  /* ------------------------------------------------------------------ */
  test('simulation does not crash with very small population', () => {
    const onGenEnd = jest.fn();

    expect(() => {
      mockP5.updateWithProps({
        onGenerationEnd: onGenEnd,
        parameters: {
          numOfBirds: 3,
          mutationRate: 0.1,
          mutationStrength: 0.1,
          ticksPerFrame: 1,
          brainDimensions: [5, 1],
        },
        paused: false,
      });
    }).not.toThrow();

    onGenEnd.mockClear();

    // Should complete a generation even with just 3 birds
    for (let i = 0; i < 200; i++) {
      expect(() => mockP5.draw()).not.toThrow();
    }

    const genCalls = onGenEnd.mock.calls
      .filter(args => args[0] !== null);
    expect(genCalls.length).toBeGreaterThanOrEqual(1);
  });

  test('simulation does not crash with minimum viable numOfBirds=2', () => {
    const onGenEnd = jest.fn();

    expect(() => {
      mockP5.updateWithProps({
        onGenerationEnd: onGenEnd,
        parameters: {
          numOfBirds: 2,
          mutationRate: 0.1,
          mutationStrength: 0.1,
          ticksPerFrame: 1,
          brainDimensions: [5, 1],
        },
        paused: false,
      });
    }).not.toThrow();

    onGenEnd.mockClear();

    for (let i = 0; i < 200; i++) {
      expect(() => mockP5.draw()).not.toThrow();
    }

    const genCalls = onGenEnd.mock.calls
      .filter(args => args[0] !== null);
    expect(genCalls.length).toBeGreaterThanOrEqual(1);
  });

  /* ------------------------------------------------------------------ */
  /*  Multiple generations with champion seeding                         */
  /* ------------------------------------------------------------------ */
  test('multi-generations preserve seeded champion architecture when dimensions match', () => {
    const onGenEnd = jest.fn();
    const serializedBrain = {
      layers: [5, 1],
      weights: [
        { rows: 5, cols: 1, data: [[0.9], [0.9], [0.9], [0.9], [0.9]] },
      ],
      biases: [
        { rows: 1, cols: 1, data: [[0.5]] },
      ],
    };

    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
        bestBird: serializedBrain,
      },
      paused: false,
    });

    onGenEnd.mockClear();

    for (let i = 0; i < 400; i++) {
      mockP5.draw();
    }

    const genCalls = onGenEnd.mock.calls
      .filter(args => args[0] !== null)
      .map(args => args[0]);

    expect(genCalls.length).toBeGreaterThanOrEqual(2);

    // Seeded champion architecture persists across generations
    genCalls.forEach(data => {
      expect(data.bestBrain.layers).toEqual([5, 1]);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  initializing with parameters resets generation counter to 1        */
  /* ------------------------------------------------------------------ */
  test('generation counter resets to 1 when parameters change', () => {
    const onGenEnd = jest.fn();

    // First run
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 10,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
      },
      paused: false,
    });

    onGenEnd.mockClear();

    // Run through one generation
    for (let i = 0; i < 200; i++) {
      mockP5.draw();
    }

    const callsBefore = onGenEnd.mock.calls.filter(args => args[0] !== null);
    expect(callsBefore.length).toBeGreaterThanOrEqual(1);

    onGenEnd.mockClear();

    // Change parameters to trigger reinit
    mockP5.updateWithProps({
      onGenerationEnd: onGenEnd,
      parameters: {
        numOfBirds: 20,
        mutationRate: 0.1,
        mutationStrength: 0.1,
        ticksPerFrame: 1,
        brainDimensions: [5, 1],
      },
      paused: false,
    });

    // Initialization calls onGenEnd(null) — clear that
    onGenEnd.mockClear();

    // Run another generation
    for (let i = 0; i < 200; i++) {
      mockP5.draw();
    }

    const callsAfter = onGenEnd.mock.calls.filter(args => args[0] !== null);
    expect(callsAfter.length).toBeGreaterThanOrEqual(1);

    // After reinit, generation counter should start from 1
    expect(callsAfter[0][0].generation).toBe(1);
  });
});
