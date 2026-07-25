import NeuralNetwork from './nn';
import Matrix from './matrix';

/**
 * Helper: set all weights to a known value and biases to a known value
 * so serialization round-trips are deterministic.
 */
function setDeterministicValues(nn) {
  for (let i = 0; i < nn.weights.length; i++) {
    nn.weights[i] = new Matrix(nn.weights[i].rows, nn.weights[i].cols);
    nn.weights[i].fill(0.5);
    nn.biases[i] = new Matrix(nn.biases[i].rows, nn.biases[i].cols);
    nn.biases[i].fill(0.1);
  }
}

describe('NeuralNetwork serialization / deserialization', () => {
  /* ------------------------------------------------------------------ */
  /*  serialize() shape                                                  */
  /* ------------------------------------------------------------------ */
  test('serialize returns an object with layers, weights, and biases', () => {
    const nn = new NeuralNetwork([2, 3, 1]);
    const data = nn.serialize();

    expect(data).toHaveProperty('layers');
    expect(data).toHaveProperty('weights');
    expect(data).toHaveProperty('biases');
  });

  test('serialize stores layer architecture as an array of numbers', () => {
    const nn = new NeuralNetwork([4, 8, 2]);
    const data = nn.serialize();

    expect(Array.isArray(data.layers)).toBe(true);
    expect(data.layers).toEqual([4, 8, 2]);
  });

  test('serialize stores weights as an array of {rows, cols, data} objects', () => {
    const nn = new NeuralNetwork([3, 5, 2]);
    const data = nn.serialize();

    expect(Array.isArray(data.weights)).toBe(true);
    expect(data.weights.length).toBe(2); // two weight matrices for a 3-layer net

    data.weights.forEach((w, i) => {
      expect(w).toHaveProperty('rows');
      expect(w).toHaveProperty('cols');
      expect(w).toHaveProperty('data');
      expect(Array.isArray(w.data)).toBe(true);
      expect(w.data.length).toBe(w.rows);
      if (w.rows > 0) {
        expect(Array.isArray(w.data[0])).toBe(true);
        expect(w.data[0].length).toBe(w.cols);
      }
    });
  });

  test('serialize stores biases as an array of {rows, cols, data} objects', () => {
    const nn = new NeuralNetwork([3, 5, 2]);
    const data = nn.serialize();

    expect(Array.isArray(data.biases)).toBe(true);
    expect(data.biases.length).toBe(2);

    data.biases.forEach((b) => {
      expect(b).toHaveProperty('rows');
      expect(b).toHaveProperty('cols');
      expect(b).toHaveProperty('data');
    });
  });

  /* ------------------------------------------------------------------ */
  /*  NeuralNetwork.deserialize()                                        */
  /* ------------------------------------------------------------------ */
  test('deserialize reconstructs a network with the same architecture', () => {
    const nn = new NeuralNetwork([2, 4, 1]);
    setDeterministicValues(nn);
    const data = nn.serialize();
    const restored = NeuralNetwork.deserialize(data);

    expect(restored.layers.map(l => l.length)).toEqual([2, 4, 1]);
    expect(restored.weights.length).toBe(2);
    expect(restored.biases.length).toBe(2);
  });

  test('deserialize preserves weight and bias values', () => {
    const nn = new NeuralNetwork([2, 3, 1]);
    setDeterministicValues(nn);
    const data = nn.serialize();
    const restored = NeuralNetwork.deserialize(data);

    // Compare weight matrices element-by-element
    for (let i = 0; i < nn.weights.length; i++) {
      expect(restored.weights[i].rows).toBe(nn.weights[i].rows);
      expect(restored.weights[i].cols).toBe(nn.weights[i].cols);
      for (let r = 0; r < nn.weights[i].rows; r++) {
        for (let c = 0; c < nn.weights[i].cols; c++) {
          expect(restored.weights[i].data[r][c]).toBe(nn.weights[i].data[r][c]);
        }
      }
    }

    // Compare bias matrices
    for (let i = 0; i < nn.biases.length; i++) {
      expect(restored.biases[i].rows).toBe(nn.biases[i].rows);
      expect(restored.biases[i].cols).toBe(nn.biases[i].cols);
      for (let r = 0; r < nn.biases[i].rows; r++) {
        for (let c = 0; c < nn.biases[i].cols; c++) {
          expect(restored.biases[i].data[r][c]).toBe(nn.biases[i].data[r][c]);
        }
      }
    }
  });

  test('serialize-then-deserialize produces same prediction for a fixed input', () => {
    const nn = new NeuralNetwork([4, 6, 1]);
    setDeterministicValues(nn);
    const data = nn.serialize();
    const restored = NeuralNetwork.deserialize(data);

    const input = [0.2, 0.5, 0.8, 0.1];
    const originalOutput = nn.predict(input);
    const restoredOutput = restored.predict(input);

    expect(restoredOutput).toEqual(originalOutput);
  });

  test('serialize-then-deserialize round-trip works for deep architectures', () => {
    const nn = new NeuralNetwork([5, 10, 8, 4, 1]);
    setDeterministicValues(nn);
    const data = nn.serialize();
    const restored = NeuralNetwork.deserialize(data);

    const input = [0.1, 0.2, 0.3, 0.4, 0.5];
    const originalOutput = nn.predict(input);
    const restoredOutput = restored.predict(input);

    expect(restoredOutput).toEqual(originalOutput);
  });

  /* ------------------------------------------------------------------ */
  /*  Edge cases / error handling                                        */
  /* ------------------------------------------------------------------ */
  test('deserialize(null) does not crash the app', () => {
    expect(() => NeuralNetwork.deserialize(null)).not.toThrow();
  });

  test('deserialize(undefined) does not crash the app', () => {
    expect(() => NeuralNetwork.deserialize(undefined)).not.toThrow();
  });

  test('deserialize(missing fields) does not crash the app', () => {
    expect(() => NeuralNetwork.deserialize({})).not.toThrow();
    expect(() => NeuralNetwork.deserialize({ layers: [2, 1] })).not.toThrow();
    expect(() => NeuralNetwork.deserialize({ layers: [2, 1], weights: [] })).not.toThrow();
  });

  test('deserialize returns null for invalid input', () => {
    expect(NeuralNetwork.deserialize(null)).toBeNull();
    expect(NeuralNetwork.deserialize(undefined)).toBeNull();
    expect(NeuralNetwork.deserialize({})).toBeNull();
    expect(NeuralNetwork.deserialize({ layers: 'abc' })).toBeNull();
    expect(NeuralNetwork.deserialize({ layers: [1] })).toBeNull();
  });

  test.each([
    [[0, 1]],
    [[-1, 1]],
    [[5, 1.5, 1]],
    [[5, NaN, 1]],
    [[5, Infinity, 1]],
  ])('deserialize rejects non-positive or non-integer layer sizes: %p', (layers) => {
    expect(NeuralNetwork.deserialize({ layers, weights: [], biases: [] })).toBeNull();
  });

  test('application architecture validation requires five inputs and one output', () => {
    expect(NeuralNetwork.isValidArchitecture([5, 8, 1], 5, 1)).toBe(true);
    expect(NeuralNetwork.isValidArchitecture([4, 1], 5, 1)).toBe(false);
    expect(NeuralNetwork.isValidArchitecture([5, 2], 5, 1)).toBe(false);
  });

  test('deserialize rejects extra weight or bias matrices', () => {
    const data = new NeuralNetwork([5, 1]).serialize();
    data.weights.push(data.weights[0]);
    expect(NeuralNetwork.deserialize(data)).toBeNull();
  });

  test('deserialize returns null when weight dimensions mismatch architecture', () => {
    // Wrong number of rows (3 instead of 5)
    const data = {
      layers: [5, 1],
      weights: [{ rows: 3, cols: 1, data: [[0.5], [0.5], [0.5]] }],
      biases: [{ rows: 1, cols: 1, data: [[0.1]] }],
    };
    expect(NeuralNetwork.deserialize(data)).toBeNull();
  });

  test('deserialize returns null when bias dimensions mismatch', () => {
    const data = {
      layers: [5, 1],
      weights: [{ rows: 5, cols: 1, data: [[0.5], [0.5], [0.5], [0.5], [0.5]] }],
      biases: [{ rows: 2, cols: 1, data: [[0.1], [0.2]] }], // should be rows=1
    };
    expect(NeuralNetwork.deserialize(data)).toBeNull();
  });

  test('deserialize handles missing weights gracefully', () => {
    expect(() => NeuralNetwork.deserialize({ layers: [2, 1] })).not.toThrow();
    expect(NeuralNetwork.deserialize({ layers: [2, 1] })).toBeNull();
    expect(() => NeuralNetwork.deserialize({ layers: [2, 1], weights: [] })).not.toThrow();
    expect(NeuralNetwork.deserialize({ layers: [2, 1], weights: [] })).toBeNull();
  });

  /* ------------------------------------------------------------------ */
  /*  Finite value validation                                            */
  /* ------------------------------------------------------------------ */
  test('deserialize returns null when weight values contain NaN', () => {
    const data = {
      layers: [5, 1],
      weights: [
        { rows: 5, cols: 1, data: [[NaN], [0.5], [0.5], [0.5], [0.5]] },
      ],
      biases: [
        { rows: 1, cols: 1, data: [[0.1]] },
      ],
    };
    expect(NeuralNetwork.deserialize(data)).toBeNull();
  });

  test('deserialize returns null when bias values contain Infinity', () => {
    const data = {
      layers: [5, 1],
      weights: [
        { rows: 5, cols: 1, data: [[0.5], [0.5], [0.5], [0.5], [0.5]] },
      ],
      biases: [
        { rows: 1, cols: 1, data: [[Infinity]] },
      ],
    };
    expect(NeuralNetwork.deserialize(data)).toBeNull();
  });

  test('deserialize accepts valid finite values', () => {
    const data = {
      layers: [5, 1],
      weights: [
        { rows: 5, cols: 1, data: [[0.5], [0.5], [0.5], [0.5], [0.5]] },
      ],
      biases: [
        { rows: 1, cols: 1, data: [[0.1]] },
      ],
    };
    const nn = NeuralNetwork.deserialize(data);
    expect(nn).not.toBeNull();
    expect(nn.weights[0].data[0][0]).toBe(0.5);
    expect(nn.biases[0].data[0][0]).toBe(0.1);
  });

  test('deserialize returns null when weight data array has fewer rows than declared', () => {
    const data = {
      layers: [5, 1],
      weights: [
        { rows: 5, cols: 1, data: [[0.5], [0.5], [0.5]] },
      ],
      biases: [
        { rows: 1, cols: 1, data: [[0.1]] },
      ],
    };
    expect(NeuralNetwork.deserialize(data)).toBeNull();
  });

  test('deserialize returns null when weight data row has fewer columns than declared', () => {
    const data = {
      layers: [5, 1],
      weights: [
        { rows: 5, cols: 2, data: [[0.5, 0.6], [0.5, 0.6], [0.5], [0.5, 0.6], [0.5, 0.6]] },
      ],
      biases: [
        { rows: 1, cols: 2, data: [[0.1, 0.2]] },
      ],
    };
    expect(NeuralNetwork.deserialize(data)).toBeNull();
  });

  test('deserialize returns null when bias data array has more rows than declared', () => {
    const data = {
      layers: [5, 1],
      weights: [
        { rows: 5, cols: 1, data: [[0.5], [0.5], [0.5], [0.5], [0.5]] },
      ],
      biases: [
        { rows: 1, cols: 1, data: [[0.1], [0.2]] },
      ],
    };
    expect(NeuralNetwork.deserialize(data)).toBeNull();
  });

  test('deserialize returns null when bias data row is missing values', () => {
    const data = {
      layers: [5, 2],
      weights: [
        { rows: 5, cols: 2, data: [[0.5, 0.6], [0.5, 0.6], [0.5, 0.6], [0.5, 0.6], [0.5, 0.6]] },
      ],
      biases: [
        { rows: 1, cols: 2, data: [[0.1]] },
      ],
    };
    expect(NeuralNetwork.deserialize(data)).toBeNull();
  });

  test('deserialize accepts valid 2D data with full arrays', () => {
    const data = {
      layers: [3, 2],
      weights: [
        { rows: 3, cols: 2, data: [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]] },
      ],
      biases: [
        { rows: 1, cols: 2, data: [[0.01, 0.02]] },
      ],
    };
    const nn = NeuralNetwork.deserialize(data);
    expect(nn).not.toBeNull();
    expect(nn.weights[0].data[0][0]).toBe(0.1);
    expect(nn.weights[0].data[2][1]).toBe(0.6);
    expect(nn.biases[0].data[0][0]).toBe(0.01);
    expect(nn.biases[0].data[0][1]).toBe(0.02);
  });

  /* ------------------------------------------------------------------ */
  /*  NeuralNetwork.copy()                                               */
  /* ------------------------------------------------------------------ */
  test('copy creates a deep independent clone with identical weights and biases', () => {
    const original = new NeuralNetwork([2, 4, 1]);
    setDeterministicValues(original);
    const cloned = original.copy();

    expect(cloned.layers.map(l => l.length)).toEqual([2, 4, 1]);

    for (let i = 0; i < original.weights.length; i++) {
      for (let r = 0; r < original.weights[i].rows; r++) {
        for (let c = 0; c < original.weights[i].cols; c++) {
          expect(cloned.weights[i].data[r][c]).toBe(original.weights[i].data[r][c]);
        }
      }
    }

    cloned.weights[0].data[0][0] = 999;
    expect(original.weights[0].data[0][0]).toBe(0.5);
  });

  /* ------------------------------------------------------------------ */
  /*  NeuralNetwork.mutate()                                             */
  /* ------------------------------------------------------------------ */
  test('mutate returns a new network with the same architecture', () => {
    const original = new NeuralNetwork([2, 4, 1]);
    const mutated = original.mutate(0, 0);

    expect(mutated.layers.map(l => l.length)).toEqual([2, 4, 1]);
    expect(mutated).not.toBe(original);
  });

  test('mutate with zero rate returns identical values', () => {
    const original = new NeuralNetwork([2, 3, 1]);
    setDeterministicValues(original);
    const mutated = original.mutate(0, 1);

    for (let i = 0; i < original.weights.length; i++) {
      for (let r = 0; r < original.weights[i].rows; r++) {
        for (let c = 0; c < original.weights[i].cols; c++) {
          expect(mutated.weights[i].data[r][c]).toBe(original.weights[i].data[r][c]);
        }
      }
      for (let r = 0; r < original.biases[i].rows; r++) {
        for (let c = 0; c < original.biases[i].cols; c++) {
          expect(mutated.biases[i].data[r][c]).toBe(original.biases[i].data[r][c]);
        }
      }
    }
  });

  test('mutate with rate 1 applies noise when Math.random is small', () => {
    const original = new NeuralNetwork([2, 3, 1]);
    setDeterministicValues(original);
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0.01);
    const mutated = original.mutate(1, 0.001);
    spy.mockRestore();

    let anyDifferent = false;
    for (let i = 0; i < original.weights.length; i++) {
      for (let r = 0; r < original.weights[i].rows; r++) {
        for (let c = 0; c < original.weights[i].cols; c++) {
          if (mutated.weights[i].data[r][c] !== original.weights[i].data[r][c]) {
            anyDifferent = true;
          }
        }
      }
    }
    expect(anyDifferent).toBe(true);
  });

  test('mutate preserves the original network (no side effects)', () => {
    const original = new NeuralNetwork([2, 3, 1]);
    setDeterministicValues(original);
    const snapshot = original.serialize();
    original.mutate(0.5, 0.1);
    const after = original.serialize();

    expect(after).toEqual(snapshot);
  });

  /* ------------------------------------------------------------------ */
  /*  NeuralNetwork.crossover()                                          */
  /* ------------------------------------------------------------------ */
  test('crossover creates a child with the same architecture as parents', () => {
    const parentA = new NeuralNetwork([2, 4, 1]);
    const parentB = new NeuralNetwork([2, 4, 1]);

    const child = NeuralNetwork.crossover(parentA, parentB);

    expect(child.layers.map(l => l.length)).toEqual([2, 4, 1]);
    expect(child.weights.length).toBe(2);
    expect(child.biases.length).toBe(2);
  });

  test('crossover child contains values from both parents', () => {
    const parentA = new NeuralNetwork([2, 2]);
    const parentB = new NeuralNetwork([2, 2]);
    parentA.weights[0].fill(0.1);
    parentA.biases[0].fill(0.1);
    parentB.weights[0].fill(0.9);
    parentB.biases[0].fill(0.9);

    let callCount = 0;
    const spy = jest.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      return callCount % 2 === 0 ? 0.6 : 0.4;
    });

    const child = NeuralNetwork.crossover(parentA, parentB);
    spy.mockRestore();

    const flatValues = [];
    for (let i = 0; i < child.weights[0].rows; i++) {
      for (let j = 0; j < child.weights[0].cols; j++) {
        flatValues.push(child.weights[0].data[i][j]);
      }
    }

    expect(flatValues).toContain(0.1);
    expect(flatValues).toContain(0.9);
  });

  test('crossover does not mutate the parents', () => {
    const parentA = new NeuralNetwork([2, 2]);
    const parentB = new NeuralNetwork([2, 2]);
    parentA.weights[0].fill(0.1);
    parentB.weights[0].fill(0.9);

    const snapshotA = parentA.serialize();
    const snapshotB = parentB.serialize();

    NeuralNetwork.crossover(parentA, parentB);

    expect(parentA.serialize()).toEqual(snapshotA);
    expect(parentB.serialize()).toEqual(snapshotB);
  });

  /* ------------------------------------------------------------------ */
  /*  Edge cases — constructor                                           */
  /* ------------------------------------------------------------------ */
  test('constructor handles single layer (no weights/biases)', () => {
    const nn = new NeuralNetwork([3]);
    expect(nn.layers.length).toBe(1);
    expect(nn.weights.length).toBe(0);
    expect(nn.biases.length).toBe(0);
  });

  test('constructor handles empty array (no layers)', () => {
    const nn = new NeuralNetwork([]);
    expect(nn.layers.length).toBe(0);
    expect(nn.weights.length).toBe(0);
  });

  /* ------------------------------------------------------------------ */
  /*  predict() basic sanity                                             */
  /* ------------------------------------------------------------------ */
  test('predict returns an array with output layer size', () => {
    const nn = new NeuralNetwork([4, 6, 2]);
    const output = nn.predict([0.1, 0.2, 0.3, 0.4]);
    expect(Array.isArray(output)).toBe(true);
    expect(output.length).toBe(2);
  });

  test('predict always returns values between 0 and 1 (sigmoid)', () => {
    const nn = new NeuralNetwork([4, 6, 1]);
    for (let trial = 0; trial < 10; trial++) {
      const input = [Math.random(), Math.random(), Math.random(), Math.random()];
      const output = nn.predict(input);
      expect(output[0]).toBeGreaterThanOrEqual(0);
      expect(output[0]).toBeLessThanOrEqual(1);
    }
  });

  test('predict with all-zero input returns 0.5 from sigmoid', () => {
    const nn = new NeuralNetwork([3, 2]);
    nn.weights[0].fill(0);
    nn.biases[0].fill(0);

    const output = nn.predict([0, 0, 0]);
    expect(output[0]).toBe(0.5);
    expect(output[1]).toBe(0.5);
  });
});
