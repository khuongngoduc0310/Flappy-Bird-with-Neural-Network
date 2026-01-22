import React, { useState, useEffect } from 'react';

const ParameterForm = ({ parameters, onChangeParameters }) => {

    const [formState, setFormState] = useState({
        numOfBirds: parameters.numOfBirds || 1000,
        mutationRate: parameters.mutationRate || 0.1,
        brainDimensions: parameters.brainDimensions || [4, 5, 1],
        bestBird: parameters.bestBird || null
    });

    useEffect(() => {
        setFormState({
            numOfBirds: parameters.numOfBirds || 1000,
            mutationRate: parameters.mutationRate || 0.1,
            brainDimensions: parameters.brainDimensions || [4, 5, 1],
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
                <div className="form-group">
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        Number of birds
                        <div className="info-icon">
                            i
                            <div className="tooltip">
                                Recommended: 1000. 
                                <br/>
                                Increases with network complexity (layers/weights) to explore the solution space effectively.
                            </div>
                        </div>
                    </label>
                    <input type="number" name="numOfBirds" value={formState.numOfBirds} onChange={handleChange} />
                </div>
                
                <div className="form-group">
                    <div className="mutation-label-row">
                        <label>Mutation Rate</label>
                        <span className="mutation-value">{formState.mutationRate}</span>
                    </div>
                    <div className="range-container">
                        <span>0</span>
                        <input
                            type="range"
                            name="mutationRate"
                            min="0"
                            max="0.5"
                            step="0.001"
                            value={formState.mutationRate}
                            onChange={handleChange}
                        />
                        <span>0.5</span>
                    </div>
                </div>

                <div className="form-group">
                    <label style={{ marginBottom: '10px' }}>Hidden Layers Structure</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {formState.brainDimensions.slice(1, -1).map((neurons, index) => (
                            <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)', minWidth: '60px' }}>Layer {index + 1}:</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={neurons}
                                    onChange={(e) => {
                                        const newDimensions = [...formState.brainDimensions];
                                        // The hidden layers start at index 1
                                        newDimensions[index + 1] = parseInt(e.target.value) || 1;
                                        setFormState(prev => ({
                                            ...prev,
                                            brainDimensions: newDimensions
                                        }));
                                    }}
                                    style={{ flex: 1 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newDimensions = formState.brainDimensions.filter((_, i) => i !== index + 1);
                                        setFormState(prev => ({
                                            ...prev,
                                            brainDimensions: newDimensions
                                        }));
                                    }}
                                    style={{
                                        background: 'rgba(255, 50, 50, 0.2)',
                                        border: '1px solid rgba(255, 50, 50, 0.5)',
                                        color: '#ff5555',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        padding: '5px 10px'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => {
                                const newDimensions = [...formState.brainDimensions];
                                // Insert a new layer before the last output layer
                                newDimensions.splice(newDimensions.length - 1, 0, 5); 
                                setFormState(prev => ({
                                    ...prev,
                                    brainDimensions: newDimensions
                                }));
                            }}
                            style={{
                                background: 'rgba(0, 243, 255, 0.1)',
                                border: '1px dashed var(--accent-primary)',
                                color: 'var(--accent-primary)',
                                padding: '8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                marginTop: '5px',
                                fontSize: '0.9rem'
                            }}
                        >
                            + Add Hidden Layer
                        </button>
                    </div>
                </div>
                
                <input type="submit" value="RESTART SIMULATION" />
            </form>
        </div>
    )
}

export default ParameterForm;