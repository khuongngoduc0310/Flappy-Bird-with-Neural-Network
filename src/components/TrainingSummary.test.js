import { render, screen } from '@testing-library/react';
import TrainingSummary from './TrainingSummary';

describe('TrainingSummary', () => {
  test('displays empty/zero placeholders when no data is provided', () => {
    render(<TrainingSummary data={[]} />);

    const labels = screen.getAllByText('—');
    expect(labels).toHaveLength(6);
  });

  test('displays empty/zero placeholders when data is null', () => {
    render(<TrainingSummary data={null} />);

    const labels = screen.getAllByText('—');
    expect(labels).toHaveLength(6);
  });

  test('displays empty/zero placeholders when data is undefined', () => {
    render(<TrainingSummary />);

    const labels = screen.getAllByText('—');
    expect(labels).toHaveLength(6);
  });

  test('displays latest generation and score after one generation', () => {
    const data = [{ generation: 1, score: 42 }];
    render(<TrainingSummary data={data} />);

    // There are two elements with '1' (latest gen + best gen) and three with '42'
    expect(screen.getAllByText('1')).toHaveLength(2);
    expect(screen.getAllByText('42')).toHaveLength(3);
  });

  test('computes best score using the highest score value', () => {
    const data = [
      { generation: 1, score: 10 },
      { generation: 2, score: 50 },
      { generation: 3, score: 30 },
    ];
    render(<TrainingSummary data={data} />);

    const values = screen.getAllByText(/^\d+$/).map(el => Number(el.textContent));
    // latest: gen 3, score 30
    // best:   gen 2, score 50
    expect(values).toContain(3);   // latest generation
    expect(values).toContain(30);  // latest score
    expect(values).toContain(2);   // best generation
    expect(values).toContain(50);  // best score
  });

  test('best generation uses the earliest generation when scores are tied', () => {
    const data = [
      { generation: 1, score: 100 },
      { generation: 2, score: 100 },
    ];
    render(<TrainingSummary data={data} />);

    // reduce picks the first element with the max score
    // latest, best, and average score cards show '100'
    expect(screen.getAllByText('100')).toHaveLength(3);
    // best generation = 1 (only one '1' appears; latest gen = 2)
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('renders all six summary cards with correct labels', () => {
    render(<TrainingSummary data={[{ generation: 5, score: 200 }]} />);

    expect(screen.getByText('Latest Generation')).toBeInTheDocument();
    expect(screen.getByText('Latest Score')).toBeInTheDocument();
    expect(screen.getByText('Best Score')).toBeInTheDocument();
    expect(screen.getByText('Best Generation')).toBeInTheDocument();
    expect(screen.getByText('Average Score')).toBeInTheDocument();
    expect(screen.getByText('Last Improvement')).toBeInTheDocument();
  });

  test.each([
    { previousScore: 10, latestScore: 15, expected: '+5' },
    { previousScore: 10, latestScore: 10, expected: '0' },
    { previousScore: 15, latestScore: 10, expected: '-5' },
  ])('displays $expected for the last improvement', ({ previousScore, latestScore, expected }) => {
    const data = [
      { generation: 1, score: previousScore },
      { generation: 2, score: latestScore },
    ];
    render(<TrainingSummary data={data} />);

    const improvementLabel = screen.getByText('Last Improvement');
    expect(improvementLabel.nextElementSibling).toHaveTextContent(expected);
  });

  test('displays the rounded average score across all generations', () => {
    const data = [
      { generation: 1, score: 10 },
      { generation: 2, score: 20 },
      { generation: 3, score: 30 },
    ];
    render(<TrainingSummary data={data} />);

    const averageLabel = screen.getByText('Average Score');
    expect(averageLabel.nextElementSibling).toHaveTextContent('20');
  });

  /* ------------------------------------------------------------------ */
  /*  Score rounding via Math.round                                      */
  /* ------------------------------------------------------------------ */
  test('displays rounded score using Math.round for floating point scores', () => {
    const data = [{ generation: 1, score: 42.7 }];
    render(<TrainingSummary data={data} />);

    expect(screen.getAllByText('43')).toHaveLength(3);
  });

  test('displays rounded best score for floating point values', () => {
    const data = [
      { generation: 1, score: 10.3 },
      { generation: 2, score: 50.9 },
    ];
    render(<TrainingSummary data={data} />);

    // latest score: Math.round(50.9) = 51
    // best score: Math.round(50.9) = 51
    expect(screen.getAllByText('51')).toHaveLength(2);
  });

  test('rounds down for scores below .5', () => {
    const data = [{ generation: 1, score: 99.4 }];
    render(<TrainingSummary data={data} />);

    expect(screen.getAllByText('99')).toHaveLength(3);
  });

  /* ------------------------------------------------------------------ */
  /*  CSS class structure                                                */
  /* ------------------------------------------------------------------ */
  test('best score and best generation cards have highlight class', () => {
    const { container } = render(<TrainingSummary data={[{ generation: 1, score: 100 }]} />);

    const summaryCards = container.querySelectorAll('.summary-card');
    expect(summaryCards).toHaveLength(6);

    // The best score and best generation cards should have 'highlight' class
    expect(summaryCards[2].classList.contains('highlight')).toBe(true);
    expect(summaryCards[3].classList.contains('highlight')).toBe(true);
    expect(summaryCards[4].classList.contains('highlight')).toBe(false);
    expect(summaryCards[5].classList.contains('highlight')).toBe(false);
  });

  test('first two cards (latest gen/score) do not have highlight class', () => {
    const { container } = render(<TrainingSummary data={[{ generation: 1, score: 100 }]} />);

    const summaryCards = container.querySelectorAll('.summary-card');
    expect(summaryCards[0].classList.contains('highlight')).toBe(false);
    expect(summaryCards[1].classList.contains('highlight')).toBe(false);
  });

  test('summary-value elements display correct formatted values', () => {
    const { container } = render(<TrainingSummary data={[{ generation: 3, score: 150 }]} />);

    const values = container.querySelectorAll('.summary-value');
    expect(values).toHaveLength(6);
    expect(values[0].textContent).toBe('3');   // latest generation
    expect(values[1].textContent).toBe('150'); // latest score
    expect(values[2].textContent).toBe('150'); // best score
    expect(values[3].textContent).toBe('3');   // best generation
    expect(values[4].textContent).toBe('150'); // average score
    expect(values[5].textContent).toBe('—');   // last improvement
  });

  test('summary-card renders with correct structure (label + value)', () => {
    const { container } = render(<TrainingSummary data={[{ generation: 5, score: 200 }]} />);

    const cards = container.querySelectorAll('.summary-card');
    cards.forEach(card => {
      expect(card.querySelector('.summary-label')).toBeInTheDocument();
      expect(card.querySelector('.summary-value')).toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Edge cases                                                         */
  /* ------------------------------------------------------------------ */
  test('handles data array with missing generation property gracefully', () => {
    render(<TrainingSummary data={[{ score: 100 }]} />);

    // Missing generation values and unavailable improvement render placeholders.
    expect(screen.getAllByText('—')).toHaveLength(3);
  });

  test('handles very large data arrays without crashing', () => {
    const data = Array.from({ length: 1000 }, (_, i) => ({
      generation: i + 1,
      score: Math.random() * 1000,
    }));

    expect(() => {
      render(<TrainingSummary data={data} />);
    }).not.toThrow();

    // Should still show the latest generation even if another statistic rounds to 1000.
    const latestGenerationCard = screen.getByText('Latest Generation').closest('.summary-card');
    expect(latestGenerationCard.querySelector('.summary-value')).toHaveTextContent('1000');
  });
});
