import React from 'react';

const FitnessChart = ({ data }) => {
    if (!data || data.length === 0) return (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            No data yet. Complete a generation to see stats.
        </div>
    );

    const width = 800;
    const height = 400;
    const padding = 40;

    // Find max values for scaling
    const maxScore = Math.max(...data.map(d => d.score), 10); // Minimum scale of 10
    console.log(maxScore);
    const maxGen = Math.max(...data.map(d => d.generation), 10);

    // Helpers to map values to coordinates
    const getX = (gen) => padding + ((gen - 1) / (maxGen - 1 || 1)) * (width - 2 * padding);
    const getY = (score) => height - padding - (score / maxScore) * (height - 2 * padding);

    // Create path for the line
    let pathD = `M ${getX(data[0].generation)} ${getY(data[0].score)}`;
    for (let i = 1; i < data.length; i++) {
        pathD += ` L ${getX(data[i].generation)} ${getY(data[i].score)}`;
    }

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
                    <React.Fragment key={tick}>
                        <line 
                            x1={padding} 
                            y1={padding + tick * (height - 2 * padding)} 
                            x2={width - padding} 
                            y2={padding + tick * (height - 2 * padding)} 
                            stroke="rgba(255,255,255,0.05)" 
                            strokeWidth="1" 
                        />
                        <line 
                            x1={padding + tick * (width - 2 * padding)} 
                            y1={padding} 
                            x2={padding + tick * (width - 2 * padding)} 
                            y2={height - padding} 
                            stroke="rgba(255,255,255,0.05)" 
                            strokeWidth="1" 
                        />
                    </React.Fragment>
                ))}

                {/* Axes */}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(255,255,255,0.2)" strokeWidth="4" />

                {/* Area under the line */}
                <path 
                    d={`${pathD} L ${getX(data[data.length - 1].generation)} ${height - padding} L ${getX(data[0].generation)} ${height - padding} Z`} 
                    fill="rgba(0, 243, 255, 0.1)" 
                />

                {/* Line Graph */}
                <path d={pathD} fill="none" stroke="var(--accent-primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

                {/* Data Points */}
                {data.map((d, i) => (
                    <g key={i}>
                        <circle 
                            cx={getX(d.generation)} 
                            cy={getY(d.score)} 
                            r="5" 
                            fill="#050505" 
                            stroke="var(--accent-primary)"
                            strokeWidth="2"
                        />
                    </g>
                ))}

                {/* Axis Titles */}
                <text 
                    x={width / 2} 
                    y={height - 5} 
                    fill="var(--text-secondary)" 
                    fontSize="20" 
                    textAnchor="middle" 
                    fontWeight="600"
                    style={{ textTransform: 'uppercase', letterSpacing: '1px' }}
                >
                    Generation
                </text>
                <text 
                    x={-height / 2} 
                    y={15} 
                    fill="var(--text-secondary)" 
                    fontSize="20" 
                    textAnchor="middle" 
                    fontWeight="600"
                    transform="rotate(-90)"
                    style={{ textTransform: 'uppercase', letterSpacing: '1px' }}
                >
                    Score
                </text>

                {/* Scale Labels */}
                <text x={padding} y={height - padding + 20} fill="var(--text-secondary)" fontSize="25" textAnchor="middle">1</text>
                <text x={width - padding} y={height - padding + 20} fill="var(--text-secondary)" fontSize="25" textAnchor="middle">{maxGen}</text>
                <text x={padding - 10} y={padding} fill="var(--accent-primary)" fontSize="25" textAnchor="end" alignmentBaseline="middle">{Math.round(maxScore)}</text>
                <text x={padding - 10} y={height - padding} fill="var(--text-secondary)" fontSize="25" textAnchor="end" alignmentBaseline="middle">0</text>
            </svg>
        </div>
    );
};

export default FitnessChart;
