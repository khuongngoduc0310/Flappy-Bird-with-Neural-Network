export default class Layer{
    constructor(n){
        this.length = n;
        this.nodes = [];
        for (let i = 0; i < n; i++){
            this.nodes.push(0);
        }
    }
}