import Matrix from './matrix';
import Layer from './layer';
import dimensions from './brainDimension';

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
            /*
            let layerWeigth = []
            for (iNode of layers[n-2]){
                let nodeWeight = [];
                for (oNode of layers[n-1]){
                    nodeWeight.push(Math.random())
                }
                layerWeigth.push(nodeWeight);
            }
            this.weights.push(layerWeigth);
            */
            let weight = new Matrix(this.layers[n - 2].length, this.layers[n - 1].length).randomize();
            let bias = new Matrix(1, this.layers[n - 1].length).randomize();
            this.weights.push(weight);
            this.biases.push(bias);
        }
        return this;
    }
    predict(input) {
        let m_input = new Matrix(1, input.length);
        for (let i = 0; i < input.length; i++)
            m_input.data[0][i] = input[i];
        for (let i in this.weights) {
            m_input = Matrix.dot(m_input, this.weights[i]);
            m_input = Matrix.add(m_input, this.biases[i])
        }
        m_input = m_input.data[0];
        return m_input.map(e => { return 1 / (1 + Math.exp(-e)) });
    }
    mutate(rate) {
        let mutation = new NeuralNetwork(dimensions);
        for (let i in mutation.weights) {
            mutation.weights[i] = Matrix.generateMutation(this.weights[i], rate);
            mutation.biases[i] = Matrix.generateMutation(this.biases[i], rate);
        }
        return mutation;
    }
}