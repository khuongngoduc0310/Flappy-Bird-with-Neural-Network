export default function drawNeuralNetwork(p, weights, biases, x, y, w, h, inputLabels = []) {

    if (!weights || !weights.length) {
        return;
    }
    const layers = [];
    layers.push(weights[0].rows);
    for (let i = 0; i < weights.length; i++) {
        layers.push(weights[i].cols);
    }

    const layerGap = w / (layers.length - 1);
    const nodeSize = 10;
    
    // getNodePos handles standard nodes and the bias node (nodeIndex === layerSize)
    const getNodePos = (layerIndex, nodeIndex) => {
        const layerSize = layers[layerIndex];
        const effectiveSize = layerIndex < layers.length - 1 ? layerSize + 1 : layerSize;
        const xPos = x + layerIndex * layerGap;
        const spacing = h / (effectiveSize + 1);
        const yPos = y + (nodeIndex + 1) * spacing;
        return { x: xPos, y: yPos };
    };

    // 1. Draw Weight Connections
    for (let l = 0; l < weights.length; l++) {
        const weightMatrix = weights[l];
        const srcCount = weightMatrix.rows;
        const destCount = weightMatrix.cols;

        for (let i = 0; i < srcCount; i++) {
            for (let j = 0; j < destCount; j++) {
                const val = weightMatrix.data[i][j];
                const srcPos = getNodePos(l, i);
                const destPos = getNodePos(l + 1, j);

                if (val > 0) {
                    p.stroke(0, 0, 255, p.map(val, 0, 1, 30, 200));
                } else {
                    p.stroke(255, 0, 0, p.map(Math.abs(val), 0, 1, 30, 200));
                }
                p.strokeWeight(Math.max(Math.abs(val) * 2, 0.5));
                p.line(srcPos.x, srcPos.y, destPos.x, destPos.y);
            }
        }
    }

    // 2. Draw Bias Connections
    if (biases) {
        for (let l = 0; l < biases.length; l++) {
            const biasMatrix = biases[l]; // (1 x destNodes)
            const destCount = biasMatrix.cols;
            const biasNodePos = getNodePos(l, layers[l]); // The +1 node at the bottom

            for (let j = 0; j < destCount; j++) {
                const val = biasMatrix.data[0][j];
                const destPos = getNodePos(l + 1, j);

                if (val > 0) {
                    p.stroke(0, 0, 255, p.map(val, 0, 1, 30, 200));
                } else {
                    p.stroke(255, 0, 0, p.map(Math.abs(val), 0, 1, 30, 200));
                }
                p.strokeWeight(Math.max(Math.abs(val) * 2, 0.5));
                p.line(biasNodePos.x, biasNodePos.y, destPos.x, destPos.y);
            }
        }
    }

    // 3. Draw Nodes and Labels
    for (let l = 0; l < layers.length; l++) {
        const isLastLayer = l === layers.length - 1;
        const nodesInLayer = layers[l];
        
        // Loop through standard nodes
        for (let i = 0; i < nodesInLayer; i++) {
            const pos = getNodePos(l, i);
            p.noStroke();
            p.fill(50);
            p.ellipse(pos.x, pos.y, nodeSize);

            // Input Labels
            if (l === 0 && inputLabels[i]) {
                p.fill(0);
                p.textAlign(p.RIGHT, p.CENTER);
                p.textSize(10);
                p.text(inputLabels[i], pos.x - 12, pos.y);
            }
            // Output Label
            if (isLastLayer) {
                p.fill(0);
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(12);
                p.text("Flap", pos.x + 12, pos.y);
            }
        }

        // Add Bias Node (except for output layer)
        if (!isLastLayer) {
            const bPos = getNodePos(l, nodesInLayer);
            p.noStroke();
            p.fill(255, 126, 0); // Yellow for Bias Node
            p.ellipse(bPos.x, bPos.y, nodeSize + 2);
            p.fill(0);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(8);
            p.text("1", bPos.x, bPos.y);
            
            p.fill(0);
            p.textAlign(p.RIGHT, p.CENTER);
            p.textSize(9);
            p.text("bias", bPos.x - 12, bPos.y);
        }
    }
}

