import { render, screen } from '@testing-library/react';
import App from './App';
import { describe, it, expect } from 'vitest';

describe('App', () => {
  it('renders the main application page with sidebar', () => {
    render(<App />);
    // Check for the project title in the Sidebar, which is part of the Index page
    expect(screen.getByText(/My Novel/i)).toBeInTheDocument();
  });
});
