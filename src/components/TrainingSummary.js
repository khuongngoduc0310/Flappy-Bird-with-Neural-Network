import React from 'react';

const TrainingSummary = ({ data }) => {
  const latestGen = data && data.length > 0 ? data[data.length - 1] : null;
  const bestGen = data && data.length > 0
    ? data.reduce((best, curr) => (curr.score > best.score ? curr : best), data[0])
    : null;
  const averageScore = data && data.length > 0
    ? Math.round(data.reduce((total, generation) => total + generation.score, 0) / data.length)
    : null;
  const lastImprovement = data && data.length > 1
    ? Math.round(data[data.length - 1].score - data[data.length - 2].score)
    : null;
  const formattedImprovement = lastImprovement > 0 ? `+${lastImprovement}` : lastImprovement;

  return (
    <div className="training-summary">
      <div className="summary-card">
        <span className="summary-label">Latest Generation</span>
        <span className="summary-value">{latestGen?.generation != null ? latestGen.generation : '—'}</span>
      </div>
      <div className="summary-card">
        <span className="summary-label">Latest Score</span>
        <span className="summary-value">{latestGen ? Math.round(latestGen.score) : '—'}</span>
      </div>
      <div className="summary-card highlight">
        <span className="summary-label">Best Score</span>
        <span className="summary-value">{bestGen ? Math.round(bestGen.score) : '—'}</span>
      </div>
      <div className="summary-card highlight">
        <span className="summary-label">Best Generation</span>
        <span className="summary-value">{bestGen?.generation != null ? bestGen.generation : '—'}</span>
      </div>
      <div className="summary-card average">
        <span className="summary-label">Average Score</span>
        <span className="summary-value">{averageScore != null ? averageScore : '—'}</span>
      </div>
      <div className="summary-card improvement">
        <span className="summary-label">Last Improvement</span>
        <span className="summary-value">{lastImprovement != null ? formattedImprovement : '—'}</span>
      </div>
    </div>
  );
};

export default TrainingSummary;
