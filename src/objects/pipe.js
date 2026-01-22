export default class Pipe{
    static pipeWidth = 65;
    static size = 150;
    constructor(x){
        this.y = 50 + Math.random()*200; 
        this.x = x;
    }

    show(p, img){
        const headHeight = 35;
        const headWidth = Pipe.pipeWidth + 6;
        
        if (img) {
            // --- TOP PIPE ---
            // Draw Body
            p.fill(121, 191, 57);
            p.stroke(0);
            p.strokeWeight(2);
            p.rect(this.x + 4, 0, Pipe.pipeWidth - 8, this.y - headHeight);
            
            // Draw Head (Cap)
            p.push();
            p.translate(this.x + Pipe.pipeWidth / 2, this.y - headHeight / 2);
            p.scale(1, -1); // Flip so the rim is at the bottom
            p.imageMode(p.CENTER);
            p.image(img, 0, 0, headWidth, headHeight);
            p.pop();

            // --- BOTTOM PIPE ---
            let bottomPipeY = this.y + Pipe.size;
            let bottomPipeHeight = 600 - bottomPipeY;
            
            // Draw Body
            p.rect(this.x + 4, bottomPipeY + headHeight, Pipe.pipeWidth - 8, bottomPipeHeight - headHeight);
            
            // Draw Head (Cap)
            p.push();
            p.translate(this.x + Pipe.pipeWidth / 2, bottomPipeY + headHeight / 2);
            p.imageMode(p.CENTER);
            p.image(img, 0, 0, headWidth, headHeight);
            p.pop();

        } else {
            p.fill(121, 191, 57);
            p.stroke(0);
            p.strokeWeight(2);
            p.rect(this.x, 0, Pipe.pipeWidth, this.y);
            p.rect(this.x, this.y + Pipe.size, Pipe.pipeWidth, 600 - this.y - Pipe.size);
        }
        this.x -= 3;   
    }
}