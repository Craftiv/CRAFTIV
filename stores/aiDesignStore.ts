import { create } from 'zustand';
import { API_KEYS } from '../constants/apiKeys';

export interface DesignData {
  id: string;
  title: string;
  type: string;
  elements: any[];
  thumbnail?: string;
  description?: string;
  category?: string;
  createdAt: string;
}

interface AIDesignState {
  prompt: string;
  result: DesignData | null;
  isLoading: boolean;
  error: string | null;
  // Actions
  setPrompt: (prompt: string) => void;
  setResult: (result: DesignData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearState: () => void;
  generateDesign: (prompt: string) => Promise<DesignData | null>;
}

export const useAIDesignStore = create<AIDesignState>((set, get) => ({
  prompt: '',
  result: null,
  isLoading: false,
  error: null,
  
  setPrompt: (prompt: string) => set({ prompt }),
  setResult: (result: DesignData | null) => set({ result }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  
  clearState: () => set({ 
    prompt: '', 
    result: null, 
    isLoading: false, 
    error: null 
  }),
  
  generateDesign: async (prompt: string) => {
    set({ isLoading: true, error: null });
    
    try {
      
      // Try alternative DeepAI endpoint and format
      const deepAIResponse = await fetch('https://api.deepai.org/api/text2img', {
        method: 'POST',
        headers: {
          'Api-Key': API_KEYS.DEEPAI_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `text=${encodeURIComponent(prompt)}`,
      });
      
      
      if (!deepAIResponse.ok) {
        const errorText = await deepAIResponse.text();
        throw new Error(`DeepAI API error: ${deepAIResponse.status} - ${errorText}`);
      }
      
      const deepAIData = await deepAIResponse.json();
      
      // Check for different possible response formats
      const imageUrl = deepAIData.output_url || deepAIData.url || deepAIData.id;
      
      if (!imageUrl) {
        throw new Error('No image generated from DeepAI - missing image URL');
      }
      
      // Create design data with the generated image
      const generatedResult: DesignData = {
        id: Date.now().toString(),
        title: `AI Generated: ${prompt.slice(0, 30)}...`,
        type: 'design',
        elements: [
          {
            id: '1',
            type: 'image',
            uri: imageUrl,
            x: 50,
            y: 50,
            width: 300,
            height: 200,
          },
          {
            id: '2',
            type: 'text',
            text: 'AI Generated Design',
            x: 100,
            y: 270,
            fontSize: 18,
            color: '#333333',
            fontFamily: 'System',
          }
        ],
        thumbnail: imageUrl,
        description: prompt,
        category: 'AI Generated',
        createdAt: new Date().toISOString(),
      };
      
      set({ result: generatedResult, isLoading: false });
      return generatedResult;
      
    } catch (error: any) {
      
      set({ 
        error: error.message || 'Failed to generate design. Please try again.',
        isLoading: false 
      });
      
      // Fallback to mock data if API fails
      const mockResult: DesignData = {
        id: Date.now().toString(),
        title: `AI Generated: ${prompt.slice(0, 30)}...`,
        type: 'design',
        elements: [
          {
            id: '1',
            type: 'text',
            text: 'AI Generated Design',
            x: 100,
            y: 100,
            fontSize: 24,
            color: '#000000',
          },
          {
            id: '2',
            type: 'rectangle',
            x: 50,
            y: 50,
            width: 200,
            height: 150,
            backgroundColor: '#6366F1',
          }
        ],
        thumbnail: 'https://placehold.co/300x200/6366F1/FFFFFF?text=AI+Design',
        description: prompt,
        category: 'AI Generated',
        createdAt: new Date().toISOString(),
      };
      
      return mockResult;
    }
  },
})); 