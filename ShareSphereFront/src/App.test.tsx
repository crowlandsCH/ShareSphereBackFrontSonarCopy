import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app', () => {
  render(<App />);
  // target the main heading specifically to avoid matching multiple places
  expect(screen.getByRole('heading', { name: /sharesphere/i })).toBeInTheDocument();
});
