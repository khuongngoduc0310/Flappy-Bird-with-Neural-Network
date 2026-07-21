import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./components/P5Wrapper', () => function MockP5Wrapper() {
  return <div data-testid="p5-wrapper" />;
});

test('renders the Flappy Bird app shell', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /neural network flappy bird/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /configuration/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /live training stats/i })).toBeInTheDocument();
  expect(screen.getByTestId('p5-wrapper')).toBeInTheDocument();
});
