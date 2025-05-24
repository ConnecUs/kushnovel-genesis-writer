import { render, screen, fireEvent } from '@testing-library/react';
import Editor from './Editor';
import { describe, it, expect, vi } from 'vitest';
import { Chapter, Scene } from '@/types';

// Mock data
const mockChapter: Chapter = {
  id: 'ch1',
  title: 'Chapter 1: The Adventure Begins',
  order: 0,
  scenes: [],
};

const mockScene: Scene = {
  id: 'sc1',
  title: 'Scene 1: The Old Map',
  content: 'The dusty map lay on the ancient table.',
  order: 0,
};

const mockOnSave = vi.fn();

describe('Editor Component', () => {
  it('renders with active scene content and a save button', () => {
    render(
      <Editor
        activeChapter={mockChapter}
        activeScene={mockScene}
        onSave={mockOnSave}
      />
    );

    // Check for the scene title (if displayed, depends on Editor's implementation - assuming it might be)
    // For now, let's check for the content which is in a textarea
    expect(screen.getByDisplayValue(mockScene.content)).toBeInTheDocument();

    // Check for the save button (assuming it has "Save" text or similar aria-label)
    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeInTheDocument();

    // Optional: Simulate a change and save
    fireEvent.change(screen.getByDisplayValue(mockScene.content), { target: { value: 'New content' } });
    fireEvent.click(saveButton);
    expect(mockOnSave).toHaveBeenCalledWith('New content', mockScene.title);
  });

  it('renders a placeholder message when no active scene is selected', () => {
    render(
      <Editor
        activeChapter={mockChapter}
        activeScene={undefined}
        onSave={mockOnSave}
      />
    );

    // Check for a placeholder message
    // Adjust the text based on actual placeholder in Editor.tsx
    expect(screen.getByText(/Select a scene to start editing/i)).toBeInTheDocument(); 
  });

  it('renders a placeholder message when no active chapter is selected', () => {
    render(
      <Editor
        activeChapter={undefined}
        activeScene={undefined}
        onSave={mockOnSave}
      />
    );
    // Check for a placeholder message
    expect(screen.getByText(/Select a scene to start editing/i)).toBeInTheDocument();
  });
});
