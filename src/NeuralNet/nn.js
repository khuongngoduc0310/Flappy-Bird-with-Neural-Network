import Matrix from './matrix';
import Layer from './layer';

export default class NeuralNetwork {
    constructor(layers) {
        this.weights = [];
        this.layers = [];
        this.biases = [];
        for (let layer of layers) {
            this.add(new Layer(layer));
        }
    }
    add(layer) {
        this.layers.push(layer);
        let n = this.layers.length;
        if (n > 1) {
            let weight = new Matrix(this.layers[n - 2].length, this.layers[n - 1].length).randomize();
            let bias = new Matrix(1, this.layers[n - 1].length).randomize();
            this.weights.push(weight);
            this.biases.push(bias);
        }
        return this;
    }
    static sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    predict(input) {
        let m_input = new Matrix(1, input.length);
        for (let i = 0; i < input.length; i++)
            m_input.data[0][i] = input[i];
        for (let i in this.weights) {
            m_input = Matrix.dot(m_input, this.weights[i]);
            m_input = Matrix.add(m_input, this.biases[i]);
            m_input = Matrix.map(m_input, NeuralNetwork.sigmoid);
        }
        return m_input.data[0];
    }
    copy() {
        const dimensions = this.layers.map(l => l.length);
        let clone = new NeuralNetwork(dimensions);
        for (let i in clone.weights) {
            clone.weights[i] = Matrix.copy(this.weights[i]);
            clone.biases[i] = Matrix.copy(this.biases[i]);
        }
        return clone;
    }

    mutate(rate, strength = 0.1) {
        const dimensions = this.layers.map(l => l.length);
        let mutation = new NeuralNetwork(dimensions);
        for (let i in mutation.weights) {
            mutation.weights[i] = Matrix.generateMutation(this.weights[i], rate, strength);
            mutation.biases[i] = Matrix.generateMutation(this.biases[i], rate, strength);
        }
        return mutation;
    }

    static crossover(parentA, parentB) {
        const dimensions = parentA.layers.map(l => l.length);
        let child = new NeuralNetwork(dimensions);
        for (let i in child.weights) {
            child.weights[i] = Matrix.crossover(parentA.weights[i], parentB.weights[i]);
            child.biases[i] = Matrix.crossover(parentA.biases[i], parentB.biases[i]);
        }
        return child;
    }

    /**
     * Serialize this neural network into a plain JSON-compatible object.
     * @returns {{layers: number[], weights: {rows: number, cols: number, data: number[][]}[], biases: {rows: number, cols: number, data: number[][]}[]}}
     */
    serialize() {
        const layers = this.layers.map(l => l.length);
        const weights = this.weights.map(w => ({
            rows: w.rows,
            cols: w.cols,
            data: w.data.map(row => [...row])
        }));
        const biases = this.biases.map(b => ({
            rows: b.rows,
            cols: b.cols,
            data: b.data.map(row => [...row])
        }));
        return { layers, weights, biases };
    }

    /**
     * Check that an architecture contains at least two positive integer layers.
     * Optional input/output sizes allow callers to enforce application constraints.
     */
    static isValidArchitecture(layers, inputSize = null, outputSize = null) {
        if (!Array.isArray(layers) || layers.length < 2 ||
            !layers.every(size => Number.isInteger(size) && size > 0)) {
            return false;
        }
        if (inputSize !== null && layers[0] !== inputSize) return false;
        if (outputSize !== null && layers[layers.length - 1] !== outputSize) return false;
        return true;
    }

    /**
     * Deserialize a plain object back into a NeuralNetwork.
     * Returns null if data is null, undefined, malformed, or has dimension mismatches.
     * @param {*} data - object with layers, weights, and biases arrays
     * @returns {NeuralNetwork|null}
     */
    static deserialize(data) {
        if (!data || !NeuralNetwork.isValidArchitecture(data.layers)) {
            return null;
        }
        try {
            const layers = data.layers;
            if (!Array.isArray(data.weights) || data.weights.length !== layers.length - 1 ||
                !Array.isArray(data.biases) || data.biases.length !== layers.length - 1) {
                return null;
            }
            const nn = new NeuralNetwork(layers);
            // Validate and restore each weight and bias matrix
            for (let i = 0; i < nn.weights.length; i++) {
                const expectedRows = layers[i];
                const expectedCols = layers[i + 1];
                const wData = data.weights && data.weights[i];
                const bData = data.biases && data.biases[i];
                if (!wData || !Array.isArray(wData.data) || wData.rows !== expectedRows || wData.cols !== expectedCols) {
                    return null;
                }
                if (!bData || !Array.isArray(bData.data) || bData.rows !== 1 || bData.cols !== expectedCols) {
                    return null;
                }
                // Validate actual data array lengths match declared dimensions
                if (wData.data.length !== wData.rows) {
                    return null;
                }
                for (let r = 0; r < wData.rows; r++) {
                    if (!Array.isArray(wData.data[r]) || wData.data[r].length !== wData.cols) {
                        return null;
                    }
                }
                if (bData.data.length !== bData.rows) {
                    return null;
                }
                for (let r = 0; r < bData.rows; r++) {
                    if (!Array.isArray(bData.data[r]) || bData.data[r].length !== bData.cols) {
                        return null;
                    }
                }
                const w = new Matrix(wData.rows, wData.cols);
                for (let r = 0; r < w.rows; r++) {
                    for (let c = 0; c < w.cols; c++) {
                        w.data[r][c] = wData.data[r][c];
                    }
                }
                nn.weights[i] = w;
                const b = new Matrix(bData.rows, bData.cols);
                for (let r = 0; r < b.rows; r++) {
                    for (let c = 0; c < b.cols; c++) {
                        b.data[r][c] = bData.data[r][c];
                    }
                }
                nn.biases[i] = b;
            }
            // Validate all values are finite numbers (not NaN, Infinity, -Infinity)
            for (let i = 0; i < nn.weights.length; i++) {
                const w = nn.weights[i];
                const b = nn.biases[i];
                for (let r = 0; r < w.rows; r++) {
                    for (let c = 0; c < w.cols; c++) {
                        if (typeof w.data[r][c] !== 'number' || !isFinite(w.data[r][c])) return null;
                    }
                }
                for (let r = 0; r < b.rows; r++) {
                    for (let c = 0; c < b.cols; c++) {
                        if (typeof b.data[r][c] !== 'number' || !isFinite(b.data[r][c])) return null;
                    }
                }
            }
            return nn;
        } catch (e) {
            return null;
        }
    }
}
