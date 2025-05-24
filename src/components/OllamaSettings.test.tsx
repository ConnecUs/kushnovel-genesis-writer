import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OllamaSettings from './OllamaSettings';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as ollamaUtils from '@/utils/ollamaUtils'; // Import all to mock one function

// Mock localStorage for the component
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    // Add a spy to setItem
    spySetItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    })
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: {
    ...localStorageMock,
    setItem: localStorageMock.spySetItem, // Use the spied version for tests
  }
});


// Mock sonner's toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock ollamaUtils, specifically testOllamaConnection
vi.mock('@/utils/ollamaUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof ollamaUtils>();
  return {
    ...actual, // Import and retain default behavior for other functions (like availableOllamaModels, defaultOllamaConfig)
    testOllamaConnection: vi.fn(), // Mock specific function
  };
});

describe('OllamaSettings Component', () => {
  const mockTestOllamaConnection = ollamaUtils.testOllamaConnection as vi.MockedFunction<typeof ollamaUtils.testOllamaConnection>;
  const { toast } = await vi.importActual<typeof import('sonner')>('sonner'); // Get actual toast for spy access if needed

  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.spySetItem.mockClear(); // Clear spy history too
    vi.clearAllMocks(); // Clears all vi mocks, including sonner and testOllamaConnection
    mockTestOllamaConnection.mockReset();
  });

  it('renders with values from localStorage if they exist', () => {
    const storedConfig = {
      enabled: true,
      serverUrl: 'http://customurl:12345',
      model: 'mistral', // A model from availableOllamaModels
    };
    localStorageMock.setItem('ollamaConfig', JSON.stringify(storedConfig));
    render(<OllamaSettings />);

    expect(screen.getByDisplayValue(storedConfig.serverUrl)).toBeInTheDocument();
    // For Shadcn Select, the value is often on the trigger button
    expect(screen.getByRole('button', { name: /Mistral/i })).toBeInTheDocument(); // Checks if "Mistral" (label for 'mistral') is displayed
    expect(screen.getByLabelText(/Enable Ollama Integration/i)).toBeChecked();
  });

  it('renders with default values if localStorage is empty or invalid', () => {
    // No localStorage set for ollamaConfig
    render(<OllamaSettings />);
    const defaultConfig = ollamaUtils.defaultOllamaConfig;

    expect(screen.getByDisplayValue(defaultConfig.serverUrl)).toBeInTheDocument();
    const defaultModelLabel = ollamaUtils.availableOllamaModels.find(m => m.value === defaultConfig.model)?.label;
    expect(screen.getByRole('button', { name: new RegExp(defaultModelLabel!, 'i') })).toBeInTheDocument();
    if (defaultConfig.enabled) {
      expect(screen.getByLabelText(/Enable Ollama Integration/i)).toBeChecked();
    } else {
      expect(screen.getByLabelText(/Enable Ollama Integration/i)).not.toBeChecked();
    }
  });

  it('allows updating the Ollama Server URL input', () => {
    render(<OllamaSettings />);
    const urlInput = screen.getByLabelText(/Ollama Server URL/i);
    fireEvent.change(urlInput, { target: { value: 'http://newurl:54321' } });
    expect(urlInput).toHaveValue('http://newurl:54321');
  });

  it('allows changing the selected model', async () => {
    render(<OllamaSettings />);
    // Default model is Llama 3 (from defaultOllamaConfig)
    const modelSelectTrigger = screen.getByRole('button', { name: /Llama 3/i });
    fireEvent.mouseDown(modelSelectTrigger); // Open dropdown

    const gemmaOption = await screen.findByText('Gemma'); // Label for 'gemma'
    fireEvent.click(gemmaOption);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Gemma/i })).toBeInTheDocument();
    });
  });

  it('allows toggling the "Enable Ollama Integration" switch', () => {
    render(<OllamaSettings />);
    const enableSwitch = screen.getByLabelText(/Enable Ollama Integration/i);
    // Default is false, toggle to true
    fireEvent.click(enableSwitch);
    expect(enableSwitch).toBeChecked();
    // Toggle back to false
    fireEvent.click(enableSwitch);
    expect(enableSwitch).not.toBeChecked();
  });

  it('saves settings to localStorage and shows success toast (Ollama disabled)', () => {
    render(<OllamaSettings />);
    const urlInput = screen.getByLabelText(/Ollama Server URL/i);
    fireEvent.change(urlInput, { target: { value: 'http://savedurl:11111' } });
    // Enable switch is off by default in this specific test (localStorage is cleared)

    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }));

    const expectedConfig = {
      enabled: false, // Switch is off
      serverUrl: 'http://savedurl:11111',
      model: ollamaUtils.defaultOllamaConfig.model, // Default model as it wasn't changed
    };
    expect(localStorageMock.spySetItem).toHaveBeenCalledWith('ollamaConfig', JSON.stringify(expectedConfig));
    expect(require('sonner').toast.success).toHaveBeenCalledWith('Ollama settings saved successfully');
  });
  
  it('warns if saving with Ollama enabled but connection not successfully tested', () => {
    render(<OllamaSettings />);
    const enableSwitch = screen.getByLabelText(/Enable Ollama Integration/i);
    fireEvent.click(enableSwitch); // Turn it on
    expect(enableSwitch).toBeChecked();

    // Connection status is 'untested' by default
    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }));
    
    expect(localStorageMock.spySetItem).not.toHaveBeenCalled(); // Should not save if enabled & not tested
    expect(require('sonner').toast.warning).toHaveBeenCalledWith('Please test the connection before saving enabled settings');
  });


  it('tests connection successfully and allows saving enabled settings', async () => {
    mockTestOllamaConnection.mockResolvedValue(true);
    render(<OllamaSettings />);
    
    const urlInput = screen.getByLabelText(/Ollama Server URL/i);
    fireEvent.change(urlInput, { target: { value: 'http://testsuccess:123' } });
    
    // Change model to 'gemma'
    const modelSelectTrigger = screen.getByRole('button', { name: /Llama 3/i }); // Default
    fireEvent.mouseDown(modelSelectTrigger);
    const gemmaOption = await screen.findByText('Gemma');
    fireEvent.click(gemmaOption);
    
    fireEvent.click(screen.getByRole('button', { name: /Test Connection/i }));

    await waitFor(() => {
      expect(mockTestOllamaConnection).toHaveBeenCalledWith({
        enabled: false, // Initial state of switch before successful test allows enabling
        serverUrl: 'http://testsuccess:123',
        model: 'gemma',
      });
    });
    await waitFor(() => {
      expect(require('sonner').toast.success).toHaveBeenCalledWith('Successfully connected to Ollama server');
    });
    // Test connection button should show success (e.g., check icon)
    expect(screen.getByRole('button', { name: /Test Connection/i }).innerHTML).toContain('lucide-check');

    // Now enable the switch
    const enableSwitch = screen.getByLabelText(/Enable Ollama Integration/i);
    fireEvent.click(enableSwitch); // This click should now work as connection was successful
    expect(enableSwitch).toBeChecked();
    
    // And save
    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }));

    const expectedConfig = {
      enabled: true,
      serverUrl: 'http://testsuccess:123',
      model: 'gemma',
    };
    expect(localStorageMock.spySetItem).toHaveBeenCalledWith('ollamaConfig', JSON.stringify(expectedConfig));
    expect(require('sonner').toast.success).toHaveBeenCalledWith('Ollama settings saved successfully');
  });

  it('tests connection with failure and shows error toast', async () => {
    mockTestOllamaConnection.mockResolvedValue(false);
    render(<OllamaSettings />);
    
    fireEvent.click(screen.getByRole('button', { name: /Test Connection/i }));

    await waitFor(() => {
      expect(mockTestOllamaConnection).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(require('sonner').toast.error).toHaveBeenCalledWith('Failed to connect to Ollama server');
    });
    // Test connection button should show failure (e.g., X icon)
    expect(screen.getByRole('button', { name: /Test Connection/i }).innerHTML).toContain('lucide-x');
  });
});
