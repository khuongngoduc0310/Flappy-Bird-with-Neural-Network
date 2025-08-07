import Bird from '../objects/bird';
import Pipe from '../objects/pipe';
import NeuralNetwork from '../NeuralNet/nn';

let HEIGHT = 600;
let WIDTH = 1200;
let spaceOfPipes = 200;
function getNewPipes(pipes) {
    let lastPipeX = 400;
    if (pipes.length > 0) lastPipeX = pipes[pipes.length - 1].x; 
    for (let i = 1; i < 11; i++){
        pipes.push(new Pipe(lastPipeX + i * spaceOfPipes));
    }
}

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

    function propUpdate(props){
        if (props.numOfBirds) {
            p.noLoop();
            numOfBirds = props.numOfBirds;
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
        // bird.show();
        totalAlive = 0;
        for (let bird of birds){
            if (bird.alive){
                bird.show(p);
                totalAlive++;
            }
        }
        for (let pipe of pipes){
            pipe.show(p);
            // birds = birds.filter(b => !checkCollision(b,pipe));
            if (pipe.x < 0 || pipe.x > 150)
                continue;
            else {
                for (let bird of birds){
                    if (checkCollision(bird,pipe) || bird.y > 600 || bird.y <= 0)
                        bird.alive = false;
                }
            }
        }
        closest = Infinity;
        closestPipe = null;
        for (let pipe of pipes){
        let d = (pipe.x + Pipe.pipeWidth + 10) - 100;
            if (d < closest && d > 0) {
                closestPipe = pipe;
                closest = d;
            }
        }
        pipes = pipes.filter((p) => p.x > -100);
        if (pipes.length < 10) getNewPipes(pipes);
        for (let bird of birds){
            if (!bird.alive) continue;
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
        if(totalAlive === 0){
            p.frameCount = 0;
            p.noLoop();
            birds.sort((a,b) => (a.score > b.score)?-1:1)
            birds = birds.slice(0,numOfBirds/10);
            for (let i = 0; i < numOfBirds/20; i++){
                birds[i].alive = true;
                birds[i].score = 0;
                birds[i].y = 200;
                birds[i].x = 100;
                birds[i].velY = 0;
                for (let k = 1; k < 20; k++){
                    newBird = new Bird(100,200);
                    newBird.setBrain(birds[i].brain.mutate(0.01));
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
        p.text(p.frameCount, 50, 20);
        p.text("Generation: " + generation, 200, 20);
        p.text("Alive: " + totalAlive, 400, 20);
        // if (bird.y >= HEIGHT) noLoop();
    }
    // function keyPressed(){
    //     switch(key){
    //         case ' ': {
    //             bird.flap();
    //         } 
    //     }
    // }
    function checkCollision(bird,pipe){
        return (((bird.x + Bird.size) >= pipe.x) && ((bird.x - Bird.size) <= (pipe.x + Pipe.pipeWidth)) && (((bird.y - Bird.size) <= pipe.y) || ((bird.y + Bird.size) >= (pipe.y + Pipe.size))));
    }

    p.updateWithProps = propUpdate;
    p.setup = setup;
    p.draw = draw;
}