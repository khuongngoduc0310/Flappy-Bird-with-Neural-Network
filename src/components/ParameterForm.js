import React, { useState, useEffect } from 'react';

const ParameterForm = ({ parameters, onChangeParameters }) => {

    const [formState, setFormState] = useState({
        numOfBirds: parameters.numOfBirds || 1000,
        mutationRate: parameters.mutationRate || 0.1,
        bestBird: parameters.bestBird || null
    });

    useEffect(() => {
        setFormState({
            numOfBirds: parameters.numOfBirds || 1000,
            mutationRate: parameters.mutationRate || 0.1,
            bestBird: parameters.bestBird || null
        });
    }, [parameters]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState(prevState => ({
            ...prevState,
            [name]: value
        }));
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        onChangeParameters(formState);
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <label>Number of birds: </label>
                <input type="number" name="numOfBirds" value={formState.numOfBirds} onChange={handleChange} />
                <div style={{ marginTop: '10px' }}>
                    <label>
                        Mutation Rate:
                        <span style={{ marginLeft: '5px' }}>
                            {formState.mutationRate}
                        </span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span>0</span>
                        <input
                            type="range"
                            name="mutationRate"
                            min="0"
                            max="0.5"
                            step="0.001"
                            value={formState.mutationRate}
                            onChange={handleChange}
                            style={{ margin: '0 10px', flexGrow: 1 }}
                        />
                        <span>0.5</span>
                    </div>
                </div>
                <input type="submit" value="Restart" style={{ marginTop: '10px' }} />
            </form>
        </div>
    )
}

export default ParameterForm;