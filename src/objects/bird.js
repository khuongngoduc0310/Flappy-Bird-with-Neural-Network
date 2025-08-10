const gravity = 20/60;
const flapForce = 4;
export default class Bird {
    static size = 10;
    constructor(x, y) {
        this.x = x;
        this.y = y; 
        this.velY = 0;
        this.score = 0;
        this.alive = true;
    }

    setBrain(nn){
        this.brain = nn;
    }

    flap() {
        this.velY = -flapForce;
    } 

    update(){
        this.y += this.velY;
        this.velY += gravity;
        // this.velY *= 0.95;
        if (this.y < 0) this.y = 0;
    }

    show(p) {
        p.fill(255, 204, 0);
        p.ellipse(this.x,this.y,Bird.size*2,Bird.size*2);
        this.update();
        if (this.alive) this.score += 0.1;
    }
}