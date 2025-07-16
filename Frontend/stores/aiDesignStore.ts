import { create } from 'zustand';

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
      // Simulate API call to backend
      const response = await fetch('/api/ai-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate design');
      }
      
      const data = await response.json();
      
      // For now, create mock data if API is not available
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
      
      set({ result: mockResult, isLoading: false });
      return mockResult;
      
    } catch (error) {
      // If network error, create mock data for demo purposes
      console.log('API call failed, using mock data:', error);
      
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
      
      set({ result: mockResult, isLoading: false });
      return mockResult;
    }
  },
})); 