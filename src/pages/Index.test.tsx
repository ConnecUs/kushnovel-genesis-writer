import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Index from './Index'; // Adjusted path assuming test is in src/pages
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock sonner's toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock exportUtils (used by ProjectStructure)
vi.mock('@/utils/exportUtils', () => ({
  exportChapter: vi.fn(),
  exportProject: vi.fn(),
  exportScene: vi.fn(),
}));

// Mock navigator.clipboard (used by PromptManager and potentially others)
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

describe('Index Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Note: Index.tsx has its own default project state.
    // For tests that modify this, each test will start with this fresh default state.
  });

  it('renders the Index page with default elements', () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );
    // Default activeTab is 'editor', check for an element from Sidebar
    expect(screen.getByLabelText(/open editor view/i)).toBeInTheDocument();
    // Default project title is "My Novel"
    expect(screen.getByText(/My Novel/i)).toBeInTheDocument();
  });

  it('allows adding a new chapter', async () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );

    // 1. Navigate to Project Structure tab
    fireEvent.click(screen.getByLabelText(/Open Chapters view/i));
    await waitFor(() => {
      expect(screen.getByText('Project Structure')).toBeInTheDocument(); // Wait for ProjectStructure to be visible
    });
    
    // 2. Click "Add Chapter" button in ProjectStructure
    fireEvent.click(screen.getByRole('button', { name: /Add Chapter/i }));

    // 3. Fill in title and save
    const newChapterTitle = 'Chapter New: The Great Test';
    fireEvent.change(screen.getByPlaceholderText(/Chapter title/i), { target: { value: newChapterTitle } });
    fireEvent.click(screen.getByRole('button', { name: "Add" })); // Form's add button

    // 4. Verify new chapter title is displayed
    await waitFor(() => {
      expect(screen.getByText(newChapterTitle)).toBeInTheDocument();
    });
    expect(vi.mocked(vi.fn()).mock.calls.length === 0); // Placeholder for sonner success call if needed
  });

  it('allows adding a new scene to an existing chapter', async () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );
    
    // 1. Navigate to Project Structure tab
    fireEvent.click(screen.getByLabelText(/Open Chapters view/i));
    await waitFor(() => {
      expect(screen.getByText('Project Structure')).toBeInTheDocument();
    });

    // 2. Expand the first chapter (default name "Chapter 1: Beginnings")
    const chapter1Title = 'Chapter 1: Beginnings';
    fireEvent.click(screen.getByText(chapter1Title));
    await waitFor(() => {
      // Wait for "Add Scene" button for this chapter to appear
      expect(screen.getAllByRole('button', { name: /Add Scene/i }).length).toBeGreaterThan(0);
    });
    
    // 3. Click "Add Scene" for that chapter
    // Assuming the first "Add Scene" button corresponds to the first expanded chapter
    const addSceneButtons = screen.getAllByRole('button', { name: /Add Scene/i });
    fireEvent.click(addSceneButtons[0]);

    // 4. Fill in title and save
    const newSceneTitle = 'Scene Extra: The Tested Path';
    fireEvent.change(screen.getByPlaceholderText(/Scene title/i), { target: { value: newSceneTitle } });
    fireEvent.click(screen.getAllByRole('button', { name: "Add" })[1]); // Form's add button (might be more than one "Add" on page)

    // 5. Verify new scene title is displayed under that chapter
    await waitFor(() => {
      expect(screen.getByText(newSceneTitle)).toBeInTheDocument();
    });
  });

  it('allows updating a scene\'s content', async () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );

    const chapter1Title = 'Chapter 1: Beginnings';
    const scene1Title = 'The Awakening'; // Default first scene of first chapter
    const initialSceneContent = 'It was a cold morning when everything changed...';
    const updatedSceneContent = 'It was a bright sunny day when nothing changed.';

    // 1. Navigate to Project Structure to select the scene
    fireEvent.click(screen.getByLabelText(/Open Chapters view/i));
    await waitFor(() => {
      expect(screen.getByText('Project Structure')).toBeInTheDocument();
    });

    // 2. Expand Chapter 1
    fireEvent.click(screen.getByText(chapter1Title));
    await waitFor(() => {
      expect(screen.getByText(scene1Title)).toBeInTheDocument();
    });

    // 3. Click the scene to select it (this should switch to Editor tab and load the scene)
    fireEvent.click(screen.getByText(scene1Title));
    
    // 4. Verify Editor is active and has the scene's initial content
    await waitFor(() => {
      // Editor's textarea should be visible and contain the initial content
      // The Editor component uses a textarea for scene content.
      const editorTextarea = screen.getByDisplayValue(initialSceneContent);
      expect(editorTextarea).toBeInTheDocument();
    });

    // 5. Type new content into the Editor's textarea
    const editorTextarea = screen.getByDisplayValue(initialSceneContent);
    fireEvent.change(editorTextarea, { target: { value: updatedSceneContent } });
    expect(screen.getByDisplayValue(updatedSceneContent)).toBeInTheDocument();


    // 6. Click "Save" in the Editor
    // The save button in Editor.tsx is <Button onClick={handleSave} ...>Save</Button>
    const saveButtonInEditor = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveButtonInEditor);

    // 7. Verify update: Navigate away and back to the scene in editor to check if content persisted
    //    a. Go back to Project Structure
    fireEvent.click(screen.getByLabelText(/Open Chapters view/i));
    await waitFor(() => {
      expect(screen.getByText('Project Structure')).toBeInTheDocument();
    });
    //    b. Reselect the same scene
    //       Ensure chapter is still expanded (it should be unless state was lost)
    //       If not, re-expand:
    if (!screen.queryByText(scene1Title)) {
        fireEvent.click(screen.getByText(chapter1Title));
        await waitFor(() => expect(screen.getByText(scene1Title)).toBeInTheDocument());
    }
    fireEvent.click(screen.getByText(scene1Title));

    //    c. Check editor content again
    await waitFor(() => {
      const editorTextareaAfterSave = screen.getByDisplayValue(updatedSceneContent);
      expect(editorTextareaAfterSave).toBeInTheDocument();
    });
     expect(vi.mocked(vi.fn()).mock.calls.length === 0); // Placeholder for sonner success call if needed
  });

  // Character State Update Tests
  it('allows adding a new character', async () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );

    // 1. Navigate to Characters tab
    fireEvent.click(screen.getByLabelText(/Open Characters view/i));
    await waitFor(() => {
      // Wait for CharacterProfile component to be visible (e.g., by its title)
      expect(screen.getByText(/^Characters$/i)).toBeInTheDocument();
    });

    // 2. Click "Add Character" button
    // The default state has one character, so the button is "Add Character"
    fireEvent.click(screen.getByRole('button', { name: /Add Character/i }));

    // 3. Fill in form
    const newCharName = 'Bernard The Brave';
    const newCharDesc = 'A valiant knight.';
    const newCharTrait = 'Courageous';
    const newCharBackground = 'Once a humble squire.';

    await waitFor(() => { // Ensure form is visible
      expect(screen.getByPlaceholderText(/Character name/i)).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByPlaceholderText(/Character name/i), { target: { value: newCharName } });
    fireEvent.change(screen.getByPlaceholderText(/Brief description of the character/i), { target: { value: newCharDesc } });
    fireEvent.change(screen.getByPlaceholderText(/Add trait \(e.g., brave, intelligent\)/i), { target: { value: newCharTrait } });
    fireEvent.click(screen.getByRole('button', { name: "Add" })); // Add trait button
    fireEvent.change(screen.getByPlaceholderText(/Character's background story/i), { target: { value: newCharBackground } });

    // 4. Save new character
    fireEvent.click(screen.getByRole('button', { name: /Save/i })); // Save button in the form

    // 5. Verify new character is displayed
    await waitFor(() => {
      expect(screen.getByText(newCharName)).toBeInTheDocument();
      expect(screen.getByText(newCharDesc)).toBeInTheDocument();
      expect(screen.getByText(newCharTrait)).toBeInTheDocument(); // Trait should be visible on card
      // Background might be truncated or partially visible, check for its presence
      expect(screen.getByText(new RegExp(newCharBackground.substring(0, 10), 'i'))).toBeInTheDocument();
    });
    // expect(vi.mocked(sonner.toast.success)).toHaveBeenCalledWith('Character added');
  });

  it('allows updating an existing character\'s details', async () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );
    const defaultCharName = 'Alex Morgan';
    const updatedCharName = 'Alex Morgan (Updated)';
    const updatedCharDesc = 'No longer haunted, now a cheerful adventurer.';

    // 1. Navigate to Characters tab
    fireEvent.click(screen.getByLabelText(/Open Characters view/i));
    await waitFor(() => {
      expect(screen.getByText(defaultCharName)).toBeInTheDocument(); // Ensure default char is loaded
    });

    // 2. Click "Edit" for the existing character
    // The edit button is an icon button. We'll find it associated with the character card.
    // A more robust way would be specific aria-labels per button.
    // For now, find the card, then the button.
    const characterCard = screen.getByText(defaultCharName).closest('.character-card');
    expect(characterCard).not.toBeNull();
    const editButton = Array.from(characterCard!.querySelectorAll('button')).find(btn => btn.innerHTML.includes('lucide-edit'));
    expect(editButton).toBeDefined();
    fireEvent.click(editButton!);

    // 3. Modify details in the form
    await waitFor(() => {
      expect(screen.getByDisplayValue(defaultCharName)).toBeInTheDocument(); // Wait for form
    });
    fireEvent.change(screen.getByDisplayValue(defaultCharName), { target: { value: updatedCharName } });
    fireEvent.change(screen.getByDisplayValue(/The protagonist with a mysterious past/i), { target: { value: updatedCharDesc } });

    // 4. Save changes
    fireEvent.click(screen.getByRole('button', { name: /Update/i })); // Button text changes to Update

    // 5. Verify updated details are displayed
    await waitFor(() => {
      expect(screen.getByText(updatedCharName)).toBeInTheDocument();
      expect(screen.getByText(updatedCharDesc)).toBeInTheDocument();
    });
    // expect(vi.mocked(sonner.toast.success)).toHaveBeenCalledWith('Character updated');
  });

  it('allows deleting an existing character', async () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );
    const charToDeleteName = 'Alex Morgan';

    // 1. Navigate to Characters tab
    fireEvent.click(screen.getByLabelText(/Open Characters view/i));
    await waitFor(() => {
      expect(screen.getByText(charToDeleteName)).toBeInTheDocument();
    });

    // 2. Click "Delete" for the existing character
    const characterCard = screen.getByText(charToDeleteName).closest('.character-card');
    expect(characterCard).not.toBeNull();
    const deleteButton = Array.from(characterCard!.querySelectorAll('button')).find(btn => btn.innerHTML.includes('lucide-trash'));
    expect(deleteButton).toBeDefined();
    fireEvent.click(deleteButton!);
    
    // No confirmation dialog in the current CharacterProfile implementation, it deletes directly.

    // 3. Verify character is no longer displayed
    await waitFor(() => {
      expect(screen.queryByText(charToDeleteName)).not.toBeInTheDocument();
    });
    // The "No Characters Yet" message should appear if it was the last one.
    // Since we are deleting the only default character:
    await waitFor(() => {
        expect(screen.getByText(/No Characters Yet/i)).toBeInTheDocument();
    });
    // expect(vi.mocked(sonner.toast.success)).toHaveBeenCalledWith('Character deleted');
  });

  // Prompt State Update Tests
  it('allows adding a new prompt', async () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );

    // 1. Navigate to Prompts tab
    fireEvent.click(screen.getByLabelText(/Open Prompts view/i));
    await waitFor(() => {
      expect(screen.getByText('Prompt Manager')).toBeInTheDocument();
    });

    // 2. Click "Add Prompt" button
    // Default state has one prompt, so button is "Add Prompt"
    fireEvent.click(screen.getByRole('button', { name: /Add Prompt/i }));

    // 3. Fill in form
    const newPromptTitle = 'Worldbuilding Detail Generator';
    const newPromptContent = 'Describe a unique custom or tradition in a fantasy village.';
    const newPromptCategoryLabel = 'Setting & World Building'; // Label for 'setting' category
    const newPromptTag = 'worldbuilding';

    await waitFor(() => { // Ensure form is visible
      expect(screen.getByPlaceholderText(/Prompt title/i)).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByPlaceholderText(/Prompt title/i), { target: { value: newPromptTitle } });
    fireEvent.change(screen.getByPlaceholderText(/Write your prompt here.../i), { target: { value: newPromptContent } });
    
    // Select category
    const categorySelect = screen.getByRole('button', { name: /Select category/i }); // Or current value like "General"
    fireEvent.mouseDown(categorySelect);
    fireEvent.click(screen.getByText(newPromptCategoryLabel)); // Click the option by its text
    
    fireEvent.change(screen.getByPlaceholderText(/Add tag/i), { target: { value: newPromptTag } });
    fireEvent.click(screen.getByRole('button', { name: "Add" })); // Add tag button

    // 4. Save new prompt
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    // 5. Verify new prompt is displayed
    await waitFor(() => {
      expect(screen.getByText(newPromptTitle)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(newPromptContent.substring(0, 20), 'i'))).toBeInTheDocument(); // Check part of content
      expect(screen.getByText(newPromptCategoryLabel)).toBeInTheDocument(); // Check displayed category label
      expect(screen.getByText(newPromptTag)).toBeInTheDocument(); // Check displayed tag
    });
    // expect(vi.mocked(sonner.toast.success)).toHaveBeenCalledWith('Prompt added');
  });

  it('allows updating an existing prompt\'s details', async () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );
    const defaultPromptTitle = 'Character Introduction';
    const updatedPromptTitle = 'Character Intro (Revised)';
    const updatedPromptContent = 'Generate a compelling introduction for a character...';

    // 1. Navigate to Prompts tab
    fireEvent.click(screen.getByLabelText(/Open Prompts view/i));
    await waitFor(() => {
      expect(screen.getByText(defaultPromptTitle)).toBeInTheDocument(); // Ensure default prompt is loaded
    });

    // 2. Click "Edit" for the existing prompt
    // Edit buttons on prompt cards have a title "Edit prompt"
    const editButton = screen.getByTitle('Edit prompt');
    fireEvent.click(editButton);

    // 3. Modify details in the form
    await waitFor(() => {
      expect(screen.getByDisplayValue(defaultPromptTitle)).toBeInTheDocument(); // Wait for form
    });
    fireEvent.change(screen.getByDisplayValue(defaultPromptTitle), { target: { value: updatedPromptTitle } });
    fireEvent.change(screen.getByDisplayValue(/Create a detailed character introduction/i), { target: { value: updatedPromptContent } });

    // 4. Save changes
    fireEvent.click(screen.getByRole('button', { name: /Update/i })); // Button text changes to Update

    // 5. Verify updated details are displayed
    await waitFor(() => {
      expect(screen.getByText(updatedPromptTitle)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(updatedPromptContent.substring(0, 20), 'i'))).toBeInTheDocument();
    });
    // expect(vi.mocked(sonner.toast.success)).toHaveBeenCalledWith('Prompt updated');
  });

  it('allows deleting an existing prompt', async () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );
    const promptToDeleteTitle = 'Character Introduction';

    // 1. Navigate to Prompts tab
    fireEvent.click(screen.getByLabelText(/Open Prompts view/i));
    await waitFor(() => {
      expect(screen.getByText(promptToDeleteTitle)).toBeInTheDocument();
    });

    // 2. Click "Delete" for the existing prompt
    // Delete buttons on prompt cards have a title "Delete prompt"
    const deleteButton = screen.getByTitle('Delete prompt');
    fireEvent.click(deleteButton);
    
    // No confirmation dialog in PromptManager for deletion.

    // 3. Verify prompt is no longer displayed
    await waitFor(() => {
      expect(screen.queryByText(promptToDeleteTitle)).not.toBeInTheDocument();
    });
    // The "No Prompts Yet" message should appear if it was the last one.
    // Since we are deleting the only default prompt:
    await waitFor(() => {
        expect(screen.getByText(/No Prompts Yet/i)).toBeInTheDocument();
    });
    // expect(vi.mocked(sonner.toast.success)).toHaveBeenCalledWith('Prompt deleted');
  });
});
