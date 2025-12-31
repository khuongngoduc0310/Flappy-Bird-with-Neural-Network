import React from 'react';
import { ReactP5Wrapper } from "@p5-wrapper/react";

const P5Wrapper = ({ sketch, parameters }) => {
    return (
        <ReactP5Wrapper sketch={sketch} parameters={parameters} />
    );
};

export default P5Wrapper;