export default class Matrix {

    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.data = [];
        for (let i = 0; i < rows; i++) {
            this.data[i] = [];
            for (let j = 0; j < cols; j++) {
                this.data[i][j] = 0;
            }
        }
    }

    randomize() {
        for (let i = 0; i < this.rows; i++) {
            this.data[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.data[i][j] = Math.random() * 2 - 1;
            }
        }
        return this;
    }

    static add(a, b) {
        let result = new Matrix(a.rows, a.cols);
        let data = result.data;
        for (let i = 0; i < result.rows; i++) {
            for (let j = 0; j < result.cols; j++) {
                data[i][j] = a.data[i][j] + b.data[i][j];
            }
        }
        return result;
    }

    multiply(k) {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.data[i][j] *= k;
            }
        }
        return this;
    }

    static dot(a, b) {
        if (a.cols !== b.rows) {
            console.log('Columns of A must match rows of B.');
            return undefined;
        }
        let result = new Matrix(a.rows, b.cols);
        for (let i = 0; i < result.rows; i++) {
            for (let j = 0; j < result.cols; j++) {
                let sum = 0;
                for (let k = 0; k < a.cols; k++) {
                    sum += a.data[i][k] * b.data[k][j];
                }
                result.data[i][j] = sum;
            }
        }
        return result;
    }

    T() {
        let result = new Matrix(this.cols, this.rows);
        for (let i = 0; i < this.cols; i++) {
            result.data[i] = [];
            for (let j = 0; j < this.rows; j++) {
                result.data[i][j] = this.data[j][i];
            }
        }
        return result;
    }

    static copy(a) {
        let result = new Matrix(a.rows, a.cols);
        for (let i = 0; i < a.rows; i++) {
            for (let j = 0; j < a.cols; j++) {
                result.data[i][j] = a.data[i][j];
            }
        }
        return result;
    }
    static randomGaussian(mean = 0, stdev = 1) {
        let u = 1 - Math.random(); // uniform(0,1) random doubles
        let v = 1 - Math.random();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return num * stdev + mean; // random normal(mean, stdev)
    }

    static generateMutation(a, rate) {
        let result = new Matrix(a.rows, a.cols);
        for (let i in a.data) {
            result.data[i] = a.data[i].map((x) => { return (Math.random() < rate) ? x + Matrix.randomGaussian(0, 0.01) : x })
        }
        return result;
    }
}