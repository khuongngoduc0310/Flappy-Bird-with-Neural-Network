# Genetic Algorithm Review & Improvement Checklist

## Current GA Summary

The current algorithm in `src/sketches/sketch.js` works like this:

- Sort birds by score when all birds die.
- Keep the top 5% of birds.
- Select parents randomly from survivors.
- Create children via crossover between two parents, then mutate.
- Preserve the best brain unchanged via elitism.

---

## High Priority

### [x] Apply activation after every neural network layer

Fixed in `src/NeuralNet/nn.js`: sigmoid is now applied after every linear layer (not just the output). Added `Matrix.map()` in `src/NeuralNet/matrix.js`.

### [x] Add elitism

Implemented in `src/sketches/sketch.js` by copying the best brain into the next generation unchanged via `NeuralNetwork.copy()`.

### [x] Fix survivor count rounding

Fixed with `Math.floor()` and a minimum survivor count of 2 in `allBirdsDead()`.

---

## Medium Priority

### [x] Add crossover

Implemented with `Matrix.crossover()` and `NeuralNetwork.crossover()`.

### [x] Add separate mutation strength

`mutationRate` controls mutation probability. `mutationStrength` controls Gaussian mutation stddev. UI slider added in `ParameterForm.js`.

---

## Performance Optimizations

### [x] Cache neural network input arrays

Each bird gets a reusable `inputs` array in `src/objects/bird.js`. Reused in `updateSimulation()` instead of allocating per frame.

### [x] Check collision only against the active pipe

Collision is checked only against `closestPipe` instead of every pipe.

### [x] Run multiple simulation ticks per rendered frame

Speed slider changed from high p5 FPS to `ticksPerFrame`. Rendering is fixed at 60 FPS. `updateSimulation()` runs 1-20 times per render frame. `Bird` and `Pipe` update/render logic is separated.

---

## Completed Features

### [x] Champion brain persistence

Implemented in `src/NeuralNet/nn.js` (serialize/deserialize), `src/sketches/sketch.js` (emit bestBrain, seed champion), `src/App.js` (localStorage save/load/clear), `src/App.css` (dark glass/cyan champion controls).

A serialized champion includes the full layer architecture, weight matrices, and bias matrices. Deserialization requires positive integer layer sizes and validates matrix counts, dimensions, and finite values. Persistence also requires the Flappy Bird architecture (five inputs and one output) and associates valid score metadata with the brain, preventing corrupt data or stale scores from affecting auto-save. Normal UI loading adopts a valid champion's hidden-layer architecture; the sketch defensively falls back to `[5, 1]` random initialization for incompatible direct props.

---

## Fitness Improvements

### [ ] Reward pipe passing

### [ ] Reward staying near the gap center

---

## Code Organization

### [ ] Extract genetic algorithm logic from `sketch.js`

### [ ] Use weighted parent selection
