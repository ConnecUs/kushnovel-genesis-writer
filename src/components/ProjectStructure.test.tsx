import { render, screen, fireEvent } from '@testing-library/react';
import ProjectStructure from './ProjectStructure';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Project, Chapter, Scene } from '@/types';

// Mock sonner's toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock exportUtils
vi.mock('@/utils/exportUtils', () => ({
  exportChapter: vi.fn(),
  exportProject: vi.fn(),
  exportScene: vi.fn(),
}));

const mockOnUpdateProject = vi.fn();
const mockOnSelectScene = vi.fn();

const mockProjectData: Project = {
  id: 'proj1',
  title: 'My Awesome Novel',
  description: 'An epic tale.',
  updated: new Date(),
  chapters: [
    {
      id: 'ch1',
      title: 'Chapter 1: The Beginning',
      order: 0,
      scenes: [
        { id: 'sc1-1', title: 'Scene 1.1: Awakening', content: '...', order: 0 },
        { id: 'sc1-2', title: 'Scene 1.2: The Journey Starts', content: '...', order: 1 },
      ],
    },
    {
      id: 'ch2',
      title: 'Chapter 2: The Conflict',
      order: 1,
      scenes: [
        { id: 'sc2-1', title: 'Scene 2.1: First Challenge', content: '...', order: 0 },
      ],
    },
  ],
  characters: [],
  prompts: [],
};

describe('ProjectStructure Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset expanded chapters for each test if needed, or pass as prop if component controlled it
  });

  it('renders the main title, project chapters, and global action buttons', () => {
    render(
      <ProjectStructure
        project={mockProjectData}
        onUpdateProject={mockOnUpdateProject}
        onSelectScene={mockOnSelectScene}
        activeChapterId={undefined}
        activeSceneId={undefined}
      />
    );

    expect(screen.getByText('Project Structure')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Chapter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();

    // Check for chapter titles
    expect(screen.getByText(mockProjectData.chapters[0].title)).toBeInTheDocument();
    expect(screen.getByText(mockProjectData.chapters[1].title)).toBeInTheDocument();
  });

  it('does not show scenes or "Add Scene" button if chapters are not expanded', () => {
    render(
      <ProjectStructure
        project={mockProjectData}
        onUpdateProject={mockOnUpdateProject}
        onSelectScene={mockOnSelectScene}
      />
    );
    // Scenes should not be visible by default
    expect(screen.queryByText(mockProjectData.chapters[0].scenes[0].title)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add Scene/i })).not.toBeInTheDocument();
  });

  it('expands a chapter and shows its scenes and "Add Scene" button on click', () => {
    render(
      <ProjectStructure
        project={mockProjectData}
        onUpdateProject={mockOnUpdateProject}
        onSelectScene={mockOnSelectScene}
      />
    );

    // Click on the first chapter title to expand it
    const chapter1TitleElement = screen.getByText(mockProjectData.chapters[0].title);
    fireEvent.click(chapter1TitleElement);

    // Now scenes for chapter 1 should be visible
    expect(screen.getByText(mockProjectData.chapters[0].scenes[0].title)).toBeInTheDocument();
    expect(screen.getByText(mockProjectData.chapters[0].scenes[1].title)).toBeInTheDocument();
    
    // "Add Scene" button for chapter 1 should be visible
    // There might be multiple "Add Scene" buttons if multiple chapters were expanded
    // We need to ensure we find the one associated with chapter 1
    const addSceneButtons = screen.getAllByRole('button', { name: /Add Scene/i });
    // This check is basic; a more robust way would be to ensure it's within the expanded chapter's DOM structure.
    expect(addSceneButtons.length).toBeGreaterThan(0); 

    // Scene for chapter 2 should still not be visible
    expect(screen.queryByText(mockProjectData.chapters[1].scenes[0].title)).not.toBeInTheDocument();
  });

  it('calls onSelectScene when a scene is clicked', () => {
    render(
      <ProjectStructure
        project={mockProjectData}
        onUpdateProject={mockOnUpdateProject}
        onSelectScene={mockOnSelectScene}
      />
    );

    // Expand the first chapter
    fireEvent.click(screen.getByText(mockProjectData.chapters[0].title));

    // Click on the first scene of the first chapter
    const sceneElement = screen.getByText(mockProjectData.chapters[0].scenes[0].title);
    fireEvent.click(sceneElement);

    expect(mockOnSelectScene).toHaveBeenCalledWith(
      mockProjectData.chapters[0].id,
      mockProjectData.chapters[0].scenes[0].id
    );
  });
  
  it('shows "Add Chapter" form when "Add Chapter" button is clicked', () => {
    render(
      <ProjectStructure
        project={mockProjectData}
        onUpdateProject={mockOnUpdateProject}
        onSelectScene={mockOnSelectScene}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Add Chapter/i }));
    expect(screen.getByPlaceholderText(/Chapter title/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Add" })).toBeInTheDocument(); // The "Add" button in the form
  });

  it('shows "Add Scene" form when "Add Scene" button is clicked after expanding a chapter', () => {
    render(
      <ProjectStructure
        project={mockProjectData}
        onUpdateProject={mockOnUpdateProject}
        onSelectScene={mockOnSelectScene}
      />
    );
    // Expand chapter
    fireEvent.click(screen.getByText(mockProjectData.chapters[0].title));
    // Click "Add Scene"
    const addSceneButton = screen.getAllByRole('button', { name: /Add Scene/i })[0]; // Assuming it's the first one for the expanded chapter
    fireEvent.click(addSceneButton);

    expect(screen.getByPlaceholderText(/Scene title/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: "Add" }).length).toBeGreaterThan(0); // The "Add" button in the scene form
  });
});
