# Flappy Bird AI with Neuroevolution

A web-based simulation where birds learn to play "Flappy Bird" through neuroevolution. This project features a **custom-built Neural Network** implemented from scratch in JavaScript, using a Genetic Algorithm to evolve the population over generations.

[**Live Demo**](https://khuongngoduc0310.github.io/Flappy-Bird-with-Neural-Network)

## 🚀 Key Features

*   **Custom Neural Network Engine**: Implemented a Feedforward Neural Network and Matrix math library entirely from scratch (no TensorFlow.js or other ML libraries).
*   **Neuroevolution & Genetic Algorithms**: Birds evolve using natural selection heuristics—performing crossover and mutation on the most successful agents of the previous generation.
*   **Interactive Visualization**: Real-time visualization of the neural network's architecture and decision-making process using **p5.js**.
*   **React Integration**: Seamless integration of the p5.js canvas loop within a modern React application.

## 🛠️ Tech Stack

*   **Frontend Framework**: React.js
*   **Graphics & Simulation**: p5.js / @p5-wrapper/react
*   **Language**: JavaScript (ES6+)
*   **Deployment**: GitHub Pages

## 🧠 How It Works

1.  **The Inputs**: Each bird's neural network receives inputs about the environment (e.g., Bird Y position, Distance to next pipe, Height of next pipe).
2.  **The Decision**: The inputs propagate through hidden layers to an output node. If the output value exceeds a threshold, the bird jumps.
3.  **Evolution**:
    *   **Selection**: When all birds die, the fittest birds (those who survived the longest) are selected.
    *   **Mutation**: Their "brains" (synaptic weights) are copied and slightly mutated to create the next generation of birds.
    *   This process repeats, producing smarter behavior over time.

## 📦 Getting Started

### Prerequisites
*   Node.js installed on your machine.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/khuongngoduc0310/Flappy-Bird-with-Neural-Network.git
    cd Flappy-Bird-with-Neural-Network
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the application:
    ```bash
    npm start
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Build for Production
```bash
npm run build
```

## 📜 License
[MIT](LICENSE)

