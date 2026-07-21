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
}
