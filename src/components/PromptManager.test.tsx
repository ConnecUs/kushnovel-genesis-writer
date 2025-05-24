import { render, screen, fireEvent } from '@testing-library/react';
import PromptManager from './PromptManager';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prompt } from '@/types'; // Assuming Prompt type is in @/types

// Mock sonner's toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

const mockOnAddPrompt = vi.fn();
const mockOnUpdatePrompt = vi.fn();
const mockOnDeletePrompt = vi.fn();

const mockPrompts: Prompt[] = [
  {
    id: 'prompt1',
    title: 'Character Backstory Ideas',
    content: 'Generate three unexpected backstory elements for a seemingly ordinary character.',
    category: 'character',
    tags: ['backstory', 'development'],
  },
  {
    id: 'prompt2',
    title: 'Plot Twist Generator',
    content: 'Suggest a plot twist for a mystery novel set in the Victorian era.',
    category: 'plot',
    tags: ['twist', 'mystery'],
  },
];

describe('PromptManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title, filter, and "Add Prompt" button when no prompts are provided', () => {
    render(
      <PromptManager
        prompts={[]}
        onAddPrompt={mockOnAddPrompt}
        onUpdatePrompt={mockOnUpdatePrompt}
        onDeletePrompt={mockOnDeletePrompt}
      />
    );

    expect(screen.getByText('Prompt Manager')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Filter by category/i })).toBeInTheDocument(); // SelectTrigger
    expect(screen.getByText(/No Prompts Yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add First Prompt/i })).toBeInTheDocument();
  });

  it('renders prompts and global actions when prompts are provided', () => {
    render(
      <PromptManager
        prompts={mockPrompts}
        onAddPrompt={mockOnAddPrompt}
        onUpdatePrompt={mockOnUpdatePrompt}
        onDeletePrompt={mockOnDeletePrompt}
      />
    );

    expect(screen.getByText('Prompt Manager')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Filter by category/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Prompt/i })).toBeInTheDocument();

    // Check for prompt titles
    expect(screen.getByText(mockPrompts[0].title)).toBeInTheDocument();
    expect(screen.getByText(mockPrompts[1].title)).toBeInTheDocument();

    // Check for part of prompt content (first prompt)
    expect(screen.getByText(new RegExp(mockPrompts[0].content.substring(0, 50), 'i'))).toBeInTheDocument();
    
    // Check for category display (first prompt)
    expect(screen.getByText(/Character Development/i)).toBeInTheDocument(); // Based on mockPrompts[0].category
  });

  it('shows the "Add Prompt" form when "Add Prompt" button is clicked', () => {
    render(
      <PromptManager
        prompts={[]}
        onAddPrompt={mockOnAddPrompt}
        onUpdatePrompt={mockOnUpdatePrompt}
        onDeletePrompt={mockOnDeletePrompt}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Add First Prompt/i }));

    expect(screen.getByText('Add Prompt')).toBeInTheDocument(); // Form title
    expect(screen.getByPlaceholderText(/Prompt title/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Write your prompt here.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
  });

  it('calls onAddPrompt with correct data when new prompt is saved', () => {
    render(
      <PromptManager
        prompts={[]}
        onAddPrompt={mockOnAddPrompt}
        onUpdatePrompt={mockOnUpdatePrompt}
        onDeletePrompt={mockOnDeletePrompt}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Add First Prompt/i }));

    fireEvent.change(screen.getByPlaceholderText(/Prompt title/i), { target: { value: 'New Test Prompt' } });
    fireEvent.change(screen.getByPlaceholderText(/Write your prompt here.../i), { target: { value: 'Test prompt content.' } });
    // Category is 'general' by default, tags are empty by default
    
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    expect(mockOnAddPrompt).toHaveBeenCalledOnce();
    expect(mockOnAddPrompt).toHaveBeenCalledWith(expect.objectContaining({
      title: 'New Test Prompt',
      content: 'Test prompt content.',
      category: 'general',
      tags: [],
    }));
    expect(vi.mocked(mockOnAddPrompt).mock.calls[0][0]).toHaveProperty('id');
  });

  it('calls onUpdatePrompt when an existing prompt is edited and saved', () => {
    render(
      <PromptManager
        prompts={[mockPrompts[0]]}
        onAddPrompt={mockOnAddPrompt}
        onUpdatePrompt={mockOnUpdatePrompt}
        onDeletePrompt={mockOnDeletePrompt}
      />
    );

    // Click edit button for the first prompt
    // Edit buttons have a title "Edit prompt"
    fireEvent.click(screen.getByTitle(/Edit prompt/i));

    expect(screen.getByText('Edit Prompt')).toBeInTheDocument(); // Form title for editing

    const newTitle = 'Updated Prompt Title';
    fireEvent.change(screen.getByDisplayValue(mockPrompts[0].title), { target: { value: newTitle } });
    fireEvent.click(screen.getByRole('button', { name: /Update/i })); // Save button text changes to Update

    expect(mockOnUpdatePrompt).toHaveBeenCalledWith(mockPrompts[0].id, expect.objectContaining({
      title: newTitle,
      content: mockPrompts[0].content, // Assuming content wasn't changed in this simple test
      category: mockPrompts[0].category,
      tags: mockPrompts[0].tags,
    }));
  });
  
  it('calls onDeletePrompt when delete button on a prompt card is clicked', () => {
    render(
      <PromptManager
        prompts={[mockPrompts[0]]}
        onAddPrompt={mockOnAddPrompt}
        onUpdatePrompt={mockOnUpdatePrompt}
        onDeletePrompt={mockOnDeletePrompt}
      />
    );
    // Delete buttons have a title "Delete prompt"
    fireEvent.click(screen.getByTitle(/Delete prompt/i));
    expect(mockOnDeletePrompt).toHaveBeenCalledWith(mockPrompts[0].id);
  });

  it('filters prompts by category', () => {
    render(
      <PromptManager
        prompts={mockPrompts} // Contains one 'character' and one 'plot'
        onAddPrompt={mockOnAddPrompt}
        onUpdatePrompt={mockOnUpdatePrompt}
        onDeletePrompt={mockOnDeletePrompt}
      />
    );
    
    // Initially both prompts should be visible
    expect(screen.getByText(mockPrompts[0].title)).toBeInTheDocument(); // Character
    expect(screen.getByText(mockPrompts[1].title)).toBeInTheDocument(); // Plot

    // Click the filter dropdown trigger
    fireEvent.mouseDown(screen.getByRole('button', { name: /Filter by category/i }));
    // Click on "Plot Ideas" category
    fireEvent.click(screen.getByText('Plot Ideas')); // This text comes from the `categories` array in the component

    // Now only the 'plot' prompt should be visible
    expect(screen.queryByText(mockPrompts[0].title)).not.toBeInTheDocument(); // Character prompt (Alice) should be gone
    expect(screen.getByText(mockPrompts[1].title)).toBeInTheDocument(); // Plot prompt (Bob) should still be there
  });
});
