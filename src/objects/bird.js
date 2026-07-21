
export default class Bird {

    static size = 15;
    static gravity = 0.6;
    static flapForce = 8;

    constructor(x, y) {
        this.x = x;
        this.y = y; 
        this.velY = 0;
        this.score = 0;
        this.alive = true;
        this.inputs = [0, 0, 0, 0, 0];
    }

    setBrain(nn){
        this.brain = nn;
    }

    flap() {
        this.velY = -Bird.flapForce;
    } 

    update(){
        this.y += this.velY;
        this.velY += Bird.gravity;
        // this.velY *= 0.95;
        if (this.y < 0) this.y = 0;
        if (this.alive) this.score += 1;
    }

    show(p, img) {
        if (img) {
            p.push();
            p.translate(this.x, this.y);
            // Rotate the bird based on its velocity
            let angle = p.map(this.velY, -Bird.flapForce, 15, -p.PI / 4, p.PI / 2);
            p.rotate(angle);
            p.imageMode(p.CENTER);
            p.image(img, 0, 0, Bird.size * 3, Bird.size * 3);
            p.pop();
        } else {
            p.fill(255, 204, 0);
            p.ellipse(this.x, this.y, Bird.size * 2, Bird.size * 2);
        }
    }
}
