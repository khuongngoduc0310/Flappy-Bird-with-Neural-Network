import birdImgPath from '../img/bird.png';
import pipeImgPath from '../img/pipe.png';
import Bird from '../objects/bird';
import Pipe from '../objects/pipe';
import NeuralNetwork from '../NeuralNet/nn';
import drawNeuralNetwork from './drawNeuralNetwork';

const HEIGHT = 600;
const WIDTH = 800;
const spaceOfPipes = 250;

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
    let newBird;
    let totalAlive = 0;
    let closestPipe;
    let closest;
    let mutationRate = 0.1;

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
            onGenerationEnd({
                generation: generation,
                score: birds[0].score
            });
        }

        birds = birds.slice(0, numOfBirds / 20);
        for (let i = 0; i < numOfBirds / 20; i++) {
            birds[i].alive = true;
            birds[i].score = 0;
            birds[i].y = 200;
            birds[i].x = 100;
            birds[i].velY = 0;
            for (let k = 1; k < 20; k++) {
                newBird = new Bird(100, 200);
                newBird.setBrain(birds[i].brain.mutate(mutationRate));
                newBird.alive = true;
                birds.push(newBird);
            }
        }
        pipes = [];
        getNewPipes(pipes);
        totalAlive = birds.length;
        p.loop();
        generation++;
    }

    let currentDimensions = [];

    function propUpdate(props) {
        onGenerationEnd = props.onGenerationEnd;
        if (props.parameters) {
            p.noLoop();
            numOfBirds = Math.max(Number(props.parameters.numOfBirds), 100);
            mutationRate = Number(props.parameters.mutationRate);
            if (props.parameters.brainDimensions) {
                currentDimensions = props.parameters.brainDimensions;
            }
            initialize();
            p.loop();
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
        for (let i = 0; i < numOfBirds; i++) {
            let bird = new Bird(100, 200);
            nn = new NeuralNetwork(currentDimensions);
            bird.setBrain(nn);
            birds.push(bird);
        }
        p.frameCount = 0;
    }

    function setup() {
        p.createCanvas(WIDTH, HEIGHT);
        p.frameRate(120); // Set frame rate to 120
        p.textSize(30);
        p.textAlign(p.CENTER, p.CENTER);
    }

    function draw() {
        p.background(255);
        totalAlive = 0;

        //Draw birds and count alive birds
        for (let bird of birds) {
            if (bird.alive) {
                bird.show(p, birdImg);
                totalAlive++;
            }
        }


        //Draw pipes and check collision
        for (let pipe of pipes) {
            pipe.show(p, pipeImg);
            // Birds are at x=100. Pipes move from right to left.
            // Check collision as soon as pipe is near the bird's x range (80-120)
            if (pipe.x < 150 && pipe.x > 0) {
                for (let bird of birds) {
                    if (bird.alive) {
                        if (checkCollision(bird, pipe) || (bird.y + Bird.size) >= HEIGHT || (bird.y - Bird.size) <= 0) {
                            bird.alive = false;
                        }
                    }
                }
            }
        }

        closest = Infinity;
        closestPipe = null;

        // Find the closest pipe that the bird hasn't fully passed yet
        for (let pipe of pipes) {
            // Bird's back is at 100 - size (20) = 80.
            // Pipe's tail is at pipe.x + Pipe.pipeWidth (65)
            // We want the pipe where the tail is still >= 80
            let pipeTail = pipe.x + Pipe.pipeWidth;
            let d = pipeTail - (100 - Bird.size);
            if (d > 0 && d < closest) {
                closestPipe = pipe;
                closest = d;
            }
        }
        
        // Remove off-screen pipes and add new pipes
        pipes = pipes.filter((p) => p.x > -100);
        if (pipes.length < 10) getNewPipes(pipes);

        // Make decision
        let displayBird = null;
        if (closestPipe) {
            for (let bird of birds) {
                if (!bird.alive) continue;
                
                let input = [];
                // NORMALIZED INPUTS (Values between 0 and 1 generally help NN learn faster)
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

        if (totalAlive === 0) allBirdsDead();
        
        p.textSize(20);
        p.text(p.frameCount, 50, 20);
        p.text("Generation: " + generation, 200, 20);
        
        const inputLabels = ["bird.y", "gap.top", "gap.bottom", "dist.x", "bird.velY"];
        if (displayBird)
            drawNeuralNetwork(p, displayBird.brain.weights, displayBird.brain.biases, 100, HEIGHT - 330, 300, 300, inputLabels);
        p.textSize(20);
        p.text("Alive: " + totalAlive, 400, 20);
        // if (bird.y >= HEIGHT) noLoop();
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