
import { toast } from "sonner";
import { AIPurpose, OllamaConfig } from "@/types";

// Default Ollama configuration
export const defaultOllamaConfig: OllamaConfig = {
  enabled: false,
  serverUrl: "http://localhost:11434", // Changed from 127.0.0.1 to localhost for better compatibility
  model: "llama3"
};

// Available Ollama models
export const availableOllamaModels = [
  { value: "llama3", label: "Llama 3" },
  { value: "mistral", label: "Mistral" },
  { value: "gemma", label: "Gemma" },
  { value: "phi", label: "Phi-2" },
  { value: "mixtral", label: "Mixtral" },
  { value: "codellama", label: "Code Llama" }
];

// Get Ollama configuration from localStorage or use default
export const getOllamaConfig = (): OllamaConfig => {
  try {
    const storedConfig = localStorage.getItem("ollamaConfig");
    if (storedConfig) {
      return JSON.parse(storedConfig);
    }
  } catch (error) {
    console.error("Error parsing Ollama config:", error);
    // In case of any errors, return the default config
  }
  return defaultOllamaConfig;
};

// Save Ollama configuration to localStorage
export const saveOllamaConfig = (config: OllamaConfig): void => {
  try {
    localStorage.setItem("ollamaConfig", JSON.stringify(config));
  } catch (error) {
    console.error("Error saving Ollama config:", error);
    toast.error("Failed to save Ollama settings");
  }
};

// Generate response using Ollama API
export const generateOllamaResponse = async (purpose: AIPurpose, content: string): Promise<string> => {
  const config = getOllamaConfig();
  
  if (!config.enabled) {
    throw new Error("Ollama integration is disabled");
  }
  
  try {
    console.log("Sending request to Ollama API:", config.serverUrl);
    const systemPrompt = getSystemPromptForPurpose(purpose);
    
    const response = await fetch(`${config.serverUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        prompt: content,
        system: systemPrompt,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ollama API error:", response.status, errorText);
      throw new Error(`Ollama API error (${response.status}): ${errorText || "Unknown error"}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error generating Ollama response:", error);
    throw error;
  }
};

// Generate system prompts based on purpose
const getSystemPromptForPurpose = (purpose: AIPurpose): string => {
  switch (purpose) {
    case 'plot-idea':
      return "You are a creative writing assistant. Generate three unique and creative plot ideas or plot twists. Be specific, original, and provide enough detail to spark inspiration.";
    case 'character-development':
      return "You are a character development expert. Suggest detailed character development opportunities or backstory elements. Focus on creating complex, believable characters with depth.";
    case 'dialogue':
      return "You are a dialogue expert. Write realistic, engaging, and character-appropriate dialogue. Ensure the dialogue reveals character and advances the narrative.";
    case 'setting-description':
      return "You are a setting description specialist. Create vivid, immersive descriptions that engage multiple senses and establish atmosphere, mood, and context.";
    case 'conflict':
      return "You are a narrative conflict expert. Suggest compelling conflicts or obstacles that create tension, challenge characters, and drive plot development.";
    case 'rewrite':
      return "You are an editing assistant. Rewrite the provided text to improve quality, clarity, and impact while maintaining the original meaning and voice.";
    default:
      return "You are a helpful writing assistant. Provide thoughtful, creative, and useful responses to help with writing projects.";
  }
};

// Test Ollama connection
export const testOllamaConnection = async (config: OllamaConfig): Promise<boolean> => {
  console.log("Testing Ollama connection to:", config.serverUrl);
  
  try {
    // First, let's validate the URL format
    if (!config.serverUrl.startsWith('http://') && !config.serverUrl.startsWith('https://')) {
      console.error("Invalid URL format. URL must start with http:// or https://");
      return false;
    }
    
    // Use a simple endpoint that should be available on all Ollama servers
    const response = await fetch(`${config.serverUrl}/api/tags`, {
      method: "GET",
      headers: {
        'Accept': 'application/json',
      },
      // Add a timeout to prevent long waits if server is unreachable
      signal: AbortSignal.timeout(5000) 
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ollama connection failed:", response.status, errorText);
      return false;
    }
    
    const data = await response.json();
    console.log("Ollama connection successful, available models:", data);
    return true;
  } catch (error) {
    console.error("Ollama connection test failed:", error);
    return false;
  }
};
