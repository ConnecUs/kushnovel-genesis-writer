import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';
import { describe, it, expect, vi } from 'vitest';
import { Project } from '@/types';

// Mock project data
const mockProject: Project = {
  id: 'proj1',
  title: 'Test Project Title',
  description: 'A test project description.',
  updated: new Date(),
  chapters: [],
  characters: [],
  prompts: [],
};

describe('Sidebar Component', () => {
  it('renders the Sidebar with project title and navigation links', () => {
    const setActiveTabMock = vi.fn();
    const setCollapsedMock = vi.fn();

    render(
      <MemoryRouter>
        <Sidebar
          project={mockProject}
          activeTab="editor"
          setActiveTab={setActiveTabMock}
          collapsed={false}
          setCollapsed={setCollapsedMock}
        />
      </MemoryRouter>
    );

    // Check for the project title
    expect(screen.getByText(/Test Project Title/i)).toBeInTheDocument();

    // Check for one of the navigation links (e.g., Editor)
    // The navigation links are buttons with aria-label attributes
    expect(screen.getByLabelText(/Open Editor view/i)).toBeInTheDocument();
    
    // Check for another navigation link (e.g., AI Assistant)
    expect(screen.getByLabelText(/Open AI Assistant view/i)).toBeInTheDocument();
  });
});
