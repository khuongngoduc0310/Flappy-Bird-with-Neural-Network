import Bird from '../objects/bird';
import Pipe from '../objects/pipe';
import NeuralNetwork from '../NeuralNet/nn';

const HEIGHT = 600;
const WIDTH = 600;
const spaceOfPipes = 200;

export default function sketch(p) {

    let numOfBirds = 1000;
    let birds = [];
    let pipes= [];  
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
        for (let i = 1; i < 11; i++){
            pipes.push(new Pipe(lastPipeX + i * spaceOfPipes));
        }
    }

    function allBirdsDead() {
            p.frameCount = 0;
            p.noLoop();
            birds.sort((a,b) => (a.score > b.score)?-1:1)
            birds = birds.slice(0,numOfBirds/20);
            for (let i = 0; i < numOfBirds/20; i++){
                birds[i].alive = true;
                birds[i].score = 0;
                birds[i].y = 200;
                birds[i].x = 100;
                birds[i].velY = 0;
                for (let k = 1; k < 20; k++){
                    newBird = new Bird(100,200);
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

    function propUpdate(props){
        if (props.parameters) {
            p.noLoop();
            numOfBirds = Number(props.parameters.numOfBirds);
            mutationRate = Number(props.parameters.mutationRate);
            console.log(props);
            initialize();
            p.loop();
        }
    }

    function initialize(){
        birds = [];
        pipes = [];
        generation = 1;
        getNewPipes(pipes);
        for (let i = 0; i < numOfBirds; i++){
            let bird = new Bird(100,200);
            nn = new NeuralNetwork([5,10,1]);
            bird.setBrain(nn);
            birds.push(bird);
        }
        p.frameCount = 0;
    }
    
    function setup() {
        p.createCanvas(WIDTH, HEIGHT);
        p.frameRate(120);
        p.textSize(30);
        p.textAlign(p.CENTER, p.CENTER);
    }

    function draw(){
        p.background(255);
        totalAlive = 0;

        //Draw birds and count alive birds
        for (let bird of birds){
            if (bird.alive){
                bird.show(p);
                totalAlive++;
            }
        }
        

        //Draw pipes and check collision
        for (let pipe of pipes){
            pipe.show(p);
            if (pipe.x < 0 || pipe.x > 150)
                continue;
                for (let bird of birds){
                    if (checkCollision(bird,pipe) || bird.y > HEIGHT || bird.y <= 0)
                        bird.alive = false;
                }
            
        }

        closest = Infinity;
        closestPipe = null;

        // Find the closest pipe
        for (let pipe of pipes){
        let d = (pipe.x + Pipe.pipeWidth + 10) - 100;
            if (d < closest && d > 0) {
                closestPipe = pipe;
                closest = d;
            }
        }
        // Remove off-screen pipes and add new pipes
        pipes = pipes.filter((p) => p.x > -100);
        if (pipes.length < 10) getNewPipes(pipes);

        // Make decision
        for (let bird of birds){
            if (!bird.alive) continue; // Skip dead birds
            let input = [];
            input[0] = bird.y;
            input[1] = closestPipe.y;
            input[2] = (closestPipe.x);
            input[3] = bird.velY;
            input[4] = (bird.y - closestPipe.y);
            let p = bird.brain.predict(input);
            if (p[0] >= 0.5){
                bird.flap();
            }
        }
        
        if(totalAlive === 0) allBirdsDead();
        p.text(p.frameCount, 50, 20);
        p.text("Generation: " + generation, 200, 20);
        p.text("Alive: " + totalAlive, 400, 20);
        // if (bird.y >= HEIGHT) noLoop();
    }
    function checkCollision(bird,pipe){
        return (((bird.x + Bird.size) >= pipe.x) && ((bird.x - Bird.size) <= (pipe.x + Pipe.pipeWidth)) && (((bird.y - Bird.size) <= pipe.y) || ((bird.y + Bird.size) >= (pipe.y + Pipe.size))));
    }

    p.updateWithProps = propUpdate;
    p.setup = setup;
    p.draw = draw;
}