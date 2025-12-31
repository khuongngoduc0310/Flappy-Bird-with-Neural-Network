export default function drawNeuralNetwork(p, weights, x, y, w, h, inputLabels = []) {

    if (!weights || !weights.length) {
        return;
    }
    const layers = [];
    // Input layer size: Rows of the first weight matrix (Source nodes)
    layers.push(weights[0].rows);
    // Hidden and Output layers sizes: Cols of each weight matrix (Destination nodes)
    for (let i = 0; i < weights.length; i++) {
        layers.push(weights[i].cols);
    }

    const layerGap = w / (layers.length - 1);
    const nodeSize = 10; // Diameter of neurons

    // Helper to get node position
    const getNodePos = (layerIndex, nodeIndex) => {
        const layerSize = layers[layerIndex];
        const xPos = x + layerIndex * layerGap;
        const spacing = h / (layerSize + 1);
        const yPos = y + (nodeIndex + 1) * spacing;
        return { x: xPos, y: yPos };
    };

    // Draw connections (Weights)
    // weights[l] connects layers[l] to layers[l+1]
    // Matrix dimensions: (Rows: Source) x (Cols: Destination)

    for (let l = 0; l < weights.length; l++) {
        const weightMatrix = weights[l];
        const srcLayerIndex = l;
        const destLayerIndex = l + 1;
        const srcCount = weightMatrix.rows; // Rows are source nodes
        const destCount = weightMatrix.cols; // Cols are destination nodes

        for (let i = 0; i < srcCount; i++) { // For each source node (row)
            for (let j = 0; j < destCount; j++) { // For each dest node (col)
                const val = weightMatrix.data[i][j]; // data[src][dest]
                const srcPos = getNodePos(srcLayerIndex, i);
                const destPos = getNodePos(destLayerIndex, j);

                // Set color based on weight
                if (val > 0) {
                    p.stroke(0, 0, 255, p.map(val, 0, 1, 50, 255)); // Blue for positive
                } else {
                    p.stroke(255, 0, 0, p.map(Math.abs(val), 0, 1, 50, 255)); // Red for negative
                }
                p.strokeWeight(Math.max(Math.abs(val) * 3, 0)); // Thickness based on weight
                p.line(srcPos.x, srcPos.y, destPos.x, destPos.y);
            }
        }
    }


    // Draw nodes
    for (let l = 0; l < layers.length; l++) {
        for (let i = 0; i < layers[l]; i++) {
            const pos = getNodePos(l, i);
            p.noStroke();
            p.fill(50);
            p.ellipse(pos.x, pos.y, nodeSize);

            // Draw labels for input layer
            if (l === 0 && inputLabels && inputLabels[i]) {
                p.fill(0);
                p.textAlign(p.RIGHT, p.CENTER);
                p.textSize(10);
                p.text(inputLabels[i], pos.x - 10, pos.y);
            }
            // Draw label for output layer
            if (l === layers.length - 1) {
                p.fill(0);
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(10);
                p.text("Flap", pos.x + 10, pos.y);
            }
        }
    }
}
