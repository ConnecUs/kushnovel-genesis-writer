import { render, screen, fireEvent } from '@testing-library/react';
import CharacterProfile from './CharacterProfile';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Character } from '@/types';

// Mock sonner's toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockOnAddCharacter = vi.fn();
const mockOnUpdateCharacter = vi.fn();
const mockOnDeleteCharacter = vi.fn();

const mockCharacters: Character[] = [
  {
    id: 'char1',
    name: 'Alice Wonderland',
    description: 'Curious and adventurous',
    traits: ['curious', 'brave'],
    background: 'Fell down a rabbit hole.',
  },
  {
    id: 'char2',
    name: 'Bob The Builder',
    description: 'Can he fix it?',
    traits: ['handy', 'optimistic'],
    background: 'Builds things.',
  },
];

describe('CharacterProfile Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('renders the title and "Add Character" button when no characters are provided initially', () => {
    render(
      <CharacterProfile
        characters={[]}
        onAddCharacter={mockOnAddCharacter}
        onUpdateCharacter={mockOnUpdateCharacter}
        onDeleteCharacter={mockOnDeleteCharacter}
      />
    );

    expect(screen.getByText(/^Characters$/i)).toBeInTheDocument(); // Main title
    expect(screen.getByText(/No Characters Yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add First Character/i })).toBeInTheDocument();
  });

  it('renders the title, "Add Character" button, and character cards when characters are provided', () => {
    render(
      <CharacterProfile
        characters={mockCharacters}
        onAddCharacter={mockOnAddCharacter}
        onUpdateCharacter={mockOnUpdateCharacter}
        onDeleteCharacter={mockOnDeleteCharacter}
      />
    );

    expect(screen.getByText(/^Characters$/i)).toBeInTheDocument(); // Main title
    expect(screen.getByRole('button', { name: /Add Character/i })).toBeInTheDocument();

    // Check for character names
    expect(screen.getByText(mockCharacters[0].name)).toBeInTheDocument();
    expect(screen.getByText(mockCharacters[1].name)).toBeInTheDocument();

    // Check for character descriptions (or part of them)
    expect(screen.getByText(mockCharacters[0].description)).toBeInTheDocument();
  });

  it('shows the "Add Character" form when "Add Character" button is clicked', () => {
    render(
      <CharacterProfile
        characters={[]}
        onAddCharacter={mockOnAddCharacter}
        onUpdateCharacter={mockOnUpdateCharacter}
        onDeleteCharacter={mockOnDeleteCharacter}
      />
    );

    const addButton = screen.getByRole('button', { name: /Add First Character/i });
    fireEvent.click(addButton);

    expect(screen.getByText(/Add Character/i)).toBeInTheDocument(); // Form title
    expect(screen.getByPlaceholderText(/Character name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
  });
  
  it('calls onAddCharacter with correct data when new character is saved', () => {
    render(
      <CharacterProfile
        characters={[]}
        onAddCharacter={mockOnAddCharacter}
        onUpdateCharacter={mockOnUpdateCharacter}
        onDeleteCharacter={mockOnDeleteCharacter}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Add First Character/i }));

    fireEvent.change(screen.getByPlaceholderText(/Character name/i), { target: { value: 'New Character Name' } });
    fireEvent.change(screen.getByPlaceholderText(/Brief description of the character/i), { target: { value: 'New Description' } });
    // Add a trait
    fireEvent.change(screen.getByPlaceholderText(/Add trait \(e.g., brave, intelligent\)/i), { target: { value: 'Brave' } });
    fireEvent.click(screen.getByRole('button', { name: "Add" })); // Add trait button
    
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    expect(mockOnAddCharacter).toHaveBeenCalledOnce();
    expect(mockOnAddCharacter).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Character Name',
      description: 'New Description',
      traits: ['Brave'],
    }));
    expect(vi.mocked(mockOnAddCharacter).mock.calls[0][0]).toHaveProperty('id'); // Ensure an ID is generated
  });

  it('shows the "Edit Character" form when edit button on a character card is clicked', () => {
    render(
      <CharacterProfile
        characters={[mockCharacters[0]]}
        onAddCharacter={mockOnAddCharacter}
        onUpdateCharacter={mockOnUpdateCharacter}
        onDeleteCharacter={mockOnDeleteCharacter}
      />
    );

    // Find the edit button for the first character
    // Assuming each character card is identifiable or the button is unique enough
    const editButtons = screen.getAllByRole('button', { name: /edit/i }); // Lucide icon name might not be directly usable as button name
    // A better way would be to get the card and query within it, or add specific aria-labels
    // For now, assuming the first "Edit" button corresponds to the first character
    fireEvent.click(editButtons[0]);
    
    expect(screen.getByText(/Edit Character/i)).toBeInTheDocument(); // Form title
    expect(screen.getByDisplayValue(mockCharacters[0].name)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Update/i })).toBeInTheDocument();
  });

  it('calls onDeleteCharacter when delete button on a character card is clicked', () => {
    render(
      <CharacterProfile
        characters={[mockCharacters[0]]}
        onAddCharacter={mockOnAddCharacter}
        onUpdateCharacter={mockOnUpdateCharacter}
        onDeleteCharacter={mockOnDeleteCharacter}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i }); // Similar to edit, Lucide icon name
    fireEvent.click(deleteButtons[0]);
    
    expect(mockOnDeleteCharacter).toHaveBeenCalledWith(mockCharacters[0].id);
  });
});
