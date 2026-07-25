import birdImgPath from '../img/bird.png';
import pipeImgPath from '../img/pipe.png';
import Bird from '../objects/bird';
import Pipe from '../objects/pipe';
import NeuralNetwork from '../NeuralNet/nn';
import drawNeuralNetwork from './drawNeuralNetwork';

const HEIGHT = 600;
const WIDTH = 800;
const spaceOfPipes = 250;
const DEFAULT_BRAIN_DIMENSIONS = [5, 1];

function simulationDimensions(dimensions) {
    return NeuralNetwork.isValidArchitecture(dimensions, 5, 1)
        ? [...dimensions]
        : [...DEFAULT_BRAIN_DIMENSIONS];
}

/**
 * Build a generation from ranked survivors. The first child is an unchanged
 * elite; all other children use two distinct parents when possible.
 */
export function breedPopulation(survivors, populationSize, mutationRate, mutationStrength) {
    if (!Array.isArray(survivors) || survivors.length === 0) return [];

    const targetSize = Math.max(2, Math.floor(populationSize));
    const nextGeneration = [];
    const eliteBird = new Bird(100, 200);
    eliteBird.setBrain(survivors[0].brain.copy());
    nextGeneration.push(eliteBird);

    while (nextGeneration.length < targetSize) {
        const parentAIndex = Math.floor(Math.random() * survivors.length);
        let parentBIndex = parentAIndex;
        if (survivors.length > 1) {
            const offset = 1 + Math.floor(Math.random() * (survivors.length - 1));
            parentBIndex = (parentAIndex + offset) % survivors.length;
        }
        const childBrain = NeuralNetwork
            .crossover(survivors[parentAIndex].brain, survivors[parentBIndex].brain)
            .mutate(mutationRate, mutationStrength);
        const child = new Bird(100, 200);
        child.setBrain(childBrain);
        nextGeneration.push(child);
    }

    return nextGeneration;
}

export default function sketch(p) {

    let birdImg, pipeImg;

    p.preload = () => {
        birdImg = p.loadImage(birdImgPath);
        pipeImg = p.loadImage(pipeImgPath);
    };

    let numOfBirds = 1000;
    let birds = [];
    let pipes = [];
    let generation = 1;
    let nn;
    let totalAlive = 0;
    let closestPipe;
    let closest;
    let mutationRate = 0.1;
    let mutationStrength = 0.1;
    let ticksPerFrame = 1;
    let displayBird = null;
    let currentBestBird = null;

    function getNewPipes(pipes) {
        let lastPipeX = 400;
        if (pipes.length > 0) lastPipeX = pipes[pipes.length - 1].x;
        for (let i = 1; i < 11; i++) {
            pipes.push(new Pipe(lastPipeX + i * spaceOfPipes));
        }
    }

    let onGenerationEnd;

    function allBirdsDead() {
        p.frameCount = 0;
        p.noLoop();
        // Sort birds by score
        birds.sort((a, b) => b.score - a.score);

        if (onGenerationEnd) {
            const bestBird = birds[0];
            onGenerationEnd({
                generation: generation,
                score: bestBird.score,
                bestBrain: bestBird.brain.serialize()
            });
        }

        const survivorCount = Math.max(2, Math.floor(numOfBirds / 20));
        const survivors = birds.slice(0, survivorCount);

        birds = breedPopulation(survivors, numOfBirds, mutationRate, mutationStrength);
        pipes = [];
        getNewPipes(pipes);
        totalAlive = birds.length;
        p.loop();
        generation++;
    }

    let currentDimensions = [...DEFAULT_BRAIN_DIMENSIONS];
    let previousParamsKey = null;
    let previousRestartCounter = 0;

    function propUpdate(props) {
        onGenerationEnd = props.onGenerationEnd;

        // Detect intentional restart request (form submit, load champion, etc.)
        const propsRestartCounter = props.restartCounter !== undefined ? props.restartCounter : 0;
        const restartTriggered = propsRestartCounter !== previousRestartCounter;
        if (restartTriggered) {
            previousRestartCounter = propsRestartCounter;
        }

        if (props.parameters) {
            const requestedPopulation = Number(props.parameters.numOfBirds);
            const requestedMutationRate = Number(props.parameters.mutationRate);
            const requestedMutationStrength = Number(props.parameters.mutationStrength);
            const newNumOfBirds = Number.isFinite(requestedPopulation)
                ? Math.max(2, Math.floor(requestedPopulation))
                : 1000;
            const newMutationRate = Number.isFinite(requestedMutationRate)
                ? Math.min(1, Math.max(0, requestedMutationRate))
                : 0.1;
            const newMutationStrength = Number.isFinite(requestedMutationStrength) && requestedMutationStrength >= 0
                ? requestedMutationStrength
                : 0.1;
            const newTicksPerFrame = Math.max(1, Math.floor(Number(props.parameters.ticksPerFrame) || 1));
            const newDimensions = simulationDimensions(props.parameters.brainDimensions || currentDimensions);
            const newBestBird = props.parameters.bestBird || null;

            // Build a key from parameters that require a fresh simulation.
            // Speed is updated live, while raw restart-sensitive prop values
            // are retained even when runtime values are normalized.
            const paramsKey = JSON.stringify({
                numOfBirds: props.parameters.numOfBirds,
                mutationRate: props.parameters.mutationRate,
                mutationStrength: props.parameters.mutationStrength,
                brainDimensions: props.parameters.brainDimensions || currentDimensions,
                bestBird: props.parameters.bestBird || null
            });

            const paramsChanged = paramsKey !== previousParamsKey;

            // Always update the local variables regardless of reinitialization
            numOfBirds = newNumOfBirds;
            mutationRate = newMutationRate;
            mutationStrength = newMutationStrength;
            ticksPerFrame = newTicksPerFrame;
            currentDimensions = newDimensions;
            currentBestBird = newBestBird;

            if (paramsChanged || restartTriggered) {
                p.noLoop();
                initialize();
                previousParamsKey = paramsKey;
                if (!props.paused) {
                    p.loop();
                }
            }
        }
        if (props.paused !== undefined) {
            if (props.paused) {
                p.noLoop();
            } else {
                p.loop();
            }
        }
    }

    function initialize() {
        birds = [];
        pipes = [];
        generation = 1;
        // Also clear history when initializing/restarting
        if (onGenerationEnd) {
            onGenerationEnd(null);
        }
        getNewPipes(pipes);

        // Attempt to deserialize a champion brain if provided
        let championBrain = null;
        if (currentBestBird) {
            try {
                championBrain = NeuralNetwork.deserialize(currentBestBird);
            } catch (e) {
                championBrain = null;
            }
        }
        // Reject networks that cannot consume the five simulation inputs or
        // produce one flap decision, then require an exact configured topology.
        if (championBrain) {
            const championLayers = championBrain.layers.map(l => l.length);
            if (!NeuralNetwork.isValidArchitecture(championLayers, 5, 1) ||
                championLayers.length !== currentDimensions.length ||
                !championLayers.every((d, i) => d === currentDimensions[i])) {
                championBrain = null;
            }
        }

        for (let i = 0; i < numOfBirds; i++) {
            let bird = new Bird(100, 200);
            if (i === 0 && championBrain) {
                // First bird gets exact copy of champion (elitism)
                bird.setBrain(championBrain.copy());
            } else if (championBrain) {
                // Remaining birds get mutated versions of the champion
                bird.setBrain(championBrain.mutate(mutationRate, mutationStrength));
            } else {
                nn = new NeuralNetwork(currentDimensions);
                bird.setBrain(nn);
            }
            birds.push(bird);
        }
        p.frameCount = 0;
    }

    function setup() {
        p.createCanvas(WIDTH, HEIGHT);
        p.frameRate(60);
        p.textSize(30);
        p.textAlign(p.CENTER, p.CENTER);
    }

    function draw() {
        for (let i = 0; i < ticksPerFrame; i++) {
            const generationContinues = updateSimulation();
            if (!generationContinues) break;
        }

        renderSimulation();
    }

    function updateSimulation() {
        displayBird = null;

        for (let bird of birds) {
            if (bird.alive) bird.update();
        }

        for (let pipe of pipes) {
            pipe.update();
        }

        closest = Infinity;
        closestPipe = null;

        // Find the closest pipe that the bird hasn't fully passed yet.
        for (let pipe of pipes) {
            // Bird's back is at 100 - size (20) = 80.
            // Pipe's tail is at pipe.x + Pipe.pipeWidth (65).
            // We want the pipe where the tail is still >= 80.
            let pipeTail = pipe.x + Pipe.pipeWidth;
            let d = pipeTail - (100 - Bird.size);
            if (d > 0 && d < closest) {
                closestPipe = pipe;
                closest = d;
            }
        }

        // Check collision only against the active pipe instead of every pipe.
        for (let bird of birds) {
            if (!bird.alive) continue;
            if (
                (closestPipe && checkCollision(bird, closestPipe)) ||
                (bird.y + Bird.size) >= HEIGHT ||
                (bird.y - Bird.size) <= 0
            ) {
                bird.alive = false;
            }
        }

        // Remove off-screen pipes and add new pipes.
        pipes = pipes.filter((p) => p.x > -100);
        if (pipes.length < 10) getNewPipes(pipes);

        // Make decisions for the next simulation tick.
        if (closestPipe) {
            for (let bird of birds) {
                if (!bird.alive) continue;

                const input = bird.inputs;
                // SCALED INPUTS (distance and velocity remain signed)
                input[0] = bird.y / HEIGHT;
                input[1] = closestPipe.y / HEIGHT; // Top of gap
                input[2] = (closestPipe.y + Pipe.size) / HEIGHT; // Bottom of gap
                input[3] = (closestPipe.x - bird.x) / WIDTH; // Horizontal distance
                input[4] = bird.velY / 15; // Normalized velocity

                let prediction = bird.brain.predict(input);
                if (prediction[0] >= 0.5) {
                    bird.flap();
                }
                displayBird = bird;
            }
        }

        totalAlive = birds.reduce((count, bird) => count + (bird.alive ? 1 : 0), 0);
        if (totalAlive === 0) {
            allBirdsDead();
            return false;
        }
        return true;
    }

    function renderSimulation() {
        p.background(255);

        for (let bird of birds) {
            if (bird.alive) {
                bird.show(p, birdImg);
            }
        }

        for (let pipe of pipes) {
            pipe.show(p, pipeImg);
        }

        p.textSize(20);
        p.text(p.frameCount, 50, 20);
        p.text("Generation: " + generation, 200, 20);
        p.text("Alive: " + totalAlive, 400, 20);
        p.text("Speed: " + ticksPerFrame + "x", 560, 20);

        const inputLabels = ["bird.y", "gap.top", "gap.bottom", "dist.x", "bird.velY"];
        if (displayBird && ticksPerFrame <= 3)
            drawNeuralNetwork(p, displayBird.brain.weights, displayBird.brain.biases, 100, HEIGHT - 330, 300, 300, inputLabels);
    }

    function checkCollision(bird, pipe) {
        // Adjust hitbox to match your visual +4 offset and -8 width reduction
        const pipeLeft = pipe.x + 4;
        const pipeRight = pipe.x + Pipe.pipeWidth - 4;
        const gapTop = pipe.y;
        const gapBottom = pipe.y + Pipe.size;

        const birdRight = bird.x + Bird.size;
        const birdLeft = bird.x - Bird.size;
        const birdTop = bird.y - Bird.size;
        const birdBottom = bird.y + Bird.size;

        const isWithinX = birdRight > pipeLeft && birdLeft < pipeRight;
        const isOutsideGap = birdTop < gapTop || birdBottom > gapBottom;

        return isWithinX && isOutsideGap;
    }

    p.updateWithProps = propUpdate;
    p.setup = setup;
    p.draw = draw;
}
