import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';


export interface Point {
  x: number;
  y: number;
}

export interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'ellipse' | 'triangle' | 'line' | 'star';
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImage?: string; // Optional background image URI
  selected: boolean;
}

export interface TextElement {
  id: string;
  type: 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  selected: boolean;
}

export interface ImageElement {
  id: string;
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  uri: string;
  selected: boolean;
}

export type Element = Shape | TextElement | ImageElement;

export type Tool = 'select' | 'rectangle' | 'circle' | 'ellipse' | 'triangle' | 'line' | 'star' | 'text' | 'image';

interface HistoryState {
  past: Element[][];
  present: Element[];
  future: Element[][];
}

interface DesignStore {
  // State
  elements: Element[];
  selectedElements: string[];
  canvasBackgroundColor: string;
  currentTool: Tool;
  history: HistoryState;
  designName: string;
  
  // Actions
  addElement: (element: Element) => void;
  updateElement: (id: string, updates: Partial<Element>) => void;
  deleteElement: (id: string) => void;
  deleteSelectedElements: () => void;
  selectElement: (id: string, multiSelect?: boolean) => void;
  clearSelection: () => void;
  moveElement: (id: string, deltaX: number, deltaY: number) => void;
  resizeElement: (id: string, newWidth: number, newHeight: number) => void;
  setCanvasBackgroundColor: (color: string) => void;
  setCurrentTool: (tool: Tool) => void;
  setDesignName: (name: string) => void;
  clearDesignName: () => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Persistence
  saveDesign: (designId?: string) => Promise<void>;
  loadDesign: (designId?: string) => Promise<void>;
  loadDesignById: (designId: string) => Promise<boolean>;
  deleteDesignById: (designId: string) => Promise<void>;
  clearDesign: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const createHistoryState = (elements: Element[]): HistoryState => ({
  past: [],
  present: elements,
  future: [],
});

// Helper function to add to history with limit
const addToHistory = (history: HistoryState, newPresent: Element[]): HistoryState => {
  const MAX_HISTORY = 50; // Limit history to prevent memory issues
  
  return {
    past: [...history.past, history.present].slice(-MAX_HISTORY),
    present: newPresent,
    future: [], // Clear future when new action is performed
  };
};

export const useDesignStore = create<DesignStore>()(
  (set: (state: Partial<DesignStore> | ((state: DesignStore) => Partial<DesignStore>), replace?: boolean) => void, get: () => DesignStore) => ({
      // Initial state
      elements: [],
      selectedElements: [],
      canvasBackgroundColor: '#FFFFFF',
      currentTool: 'select',
      history: createHistoryState([]),
      designName: 'Untitled Design',

      // Element actions
      addElement: (element: Element) => {
        const { elements, history } = get();
        const newElements = [...elements, element];
        const newHistory = addToHistory(history, newElements);
        
        set({
          elements: newElements,
          history: newHistory,
          selectedElements: [element.id],
        });
      },

      updateElement: (id: string, updates: Partial<Element>) => {
        const { elements, history } = get();
        const newElements = elements.map((el: Element) => 
          el.id === id ? { ...el, ...updates } : el
        ) as Element[];
        const newHistory = addToHistory(history, newElements);
        
        set({
          elements: newElements,
          history: newHistory,
        });
      },

      deleteElement: (id: string) => {
        const { elements, history, selectedElements } = get();
        const newElements = elements.filter((el: Element) => el.id !== id);
        const newHistory = addToHistory(history, newElements);
        
        set({
          elements: newElements,
          history: newHistory,
          selectedElements: selectedElements.filter((selectedId: string) => selectedId !== id),
        });
      },

      deleteSelectedElements: () => {
        const { elements, selectedElements, history } = get();
        const newElements = elements.filter((el: Element) => !selectedElements.includes(el.id));
        const newHistory = addToHistory(history, newElements);
        
        set({
          elements: newElements,
          history: newHistory,
          selectedElements: [],
        });
      },

      selectElement: (id: string, multiSelect = false) => {
        const { selectedElements } = get();
        let newSelectedElements: string[];
        
        if (multiSelect) {
          if (selectedElements.includes(id)) {
            newSelectedElements = selectedElements.filter((selectedId: string) => selectedId !== id);
          } else {
            newSelectedElements = [...selectedElements, id];
          }
        } else {
          newSelectedElements = [id];
        }
        
        set({ selectedElements: newSelectedElements });
      },

      clearSelection: () => {
        set({ selectedElements: [] });
      },

      moveElement: (id: string, deltaX: number, deltaY: number) => {
        const { elements, history } = get();
        const newElements = elements.map((el: Element) => {
          if (el.id === id) {
            return {
              ...el,
              x: el.x + deltaX,
              y: el.y + deltaY,
            };
          }
          return el;
        }) as Element[];
        
        const newHistory = addToHistory(history, newElements);
        set({ 
          elements: newElements,
          history: newHistory,
        });
      },

      resizeElement: (id: string, newWidth: number, newHeight: number) => {
        const { elements, history } = get();
        const newElements = elements.map((el: Element) => {
          if (el.id === id) {
            return {
              ...el,
              width: Math.max(10, newWidth), // Minimum size
              height: Math.max(10, newHeight), // Minimum size
            };
          }
          return el;
        }) as Element[];
        
        const newHistory = addToHistory(history, newElements);
        set({ 
          elements: newElements,
          history: newHistory,
        });
      },

      setCanvasBackgroundColor: (color: string) => {
        set({ canvasBackgroundColor: color });
      },

      setCurrentTool: (tool: Tool) => {
        set({ currentTool: tool });
      },

      setDesignName: (name: string) => {
        set({ designName: name });
      },

      clearDesignName: () => {
        set({ designName: 'Untitled Design' });
      },

      // History actions
      undo: () => {
        const { history } = get();
        if (history.past.length === 0) return;
        
        const previous = history.past[history.past.length - 1];
        const newPast = history.past.slice(0, history.past.length - 1);
        
        set({
          elements: previous,
          history: {
            past: newPast,
            present: previous,
            future: [history.present, ...history.future],
          },
        });
      },

      redo: () => {
        const { history } = get();
        if (history.future.length === 0) return;
        
        const next = history.future[0];
        const newFuture = history.future.slice(1);
        
        set({
          elements: next,
          history: {
            past: [...history.past, history.present],
            present: next,
            future: newFuture,
          },
        });
      },

      canUndo: () => {
        const { history } = get();
        return history.past.length > 0;
      },

      canRedo: () => {
        const { history } = get();
        return history.future.length > 0;
      },

      // Persistence actions
      saveDesign: async (designId?: string) => {
        const { elements, canvasBackgroundColor } = get();
        const designData = {
          elements,
          canvasBackgroundColor,
          timestamp: Date.now(),
        };
        
        const key = designId ? `design_${designId}` : 'design_data';
        
        try {
          await AsyncStorage.setItem(key, JSON.stringify(designData));
          console.log('Design saved successfully');
        } catch (error) {
          console.error('Failed to save design:', error);
          throw error; // Re-throw to handle in UI
        }
      },

      loadDesign: async (designId?: string) => {
        try {
          const key = designId ? `design_${designId}` : 'design_data';
          const designData = await AsyncStorage.getItem(key);
          if (designData) {
            const parsed = JSON.parse(designData);
            const elements = parsed.elements || [];
            const canvasBackgroundColor = parsed.canvasBackgroundColor || '#FFFFFF';
            
            set({
              elements,
              canvasBackgroundColor,
              history: createHistoryState(elements),
              selectedElements: [],
            });
            console.log('Design loaded successfully');
          }
        } catch (error) {
          console.error('Failed to load design:', error);
          // Reset to default state if loading fails
          set({
            elements: [],
            selectedElements: [],
            canvasBackgroundColor: '#FFFFFF',
            history: createHistoryState([]),
          });
        }
      },

      loadDesignById: async (designId: string) => {
        try {
          const key = `design_${designId}`;
          const designData = await AsyncStorage.getItem(key);
          if (designData) {
            const parsed = JSON.parse(designData);
            const elements = parsed.elements || [];
            const canvasBackgroundColor = parsed.canvasBackgroundColor || '#FFFFFF';
            
            set({
              elements,
              canvasBackgroundColor,
              history: createHistoryState(elements),
              selectedElements: [],
            });
            console.log(`Design ${designId} loaded successfully`);
            return true;
          }
          return false;
        } catch (error) {
          console.error('Failed to load design:', error);
          return false;
        }
      },

      deleteDesignById: async (designId: string) => {
        try {
          const key = `design_${designId}`;
          await AsyncStorage.removeItem(key);
          console.log(`Design ${designId} deleted successfully`);
        } catch (error) {
          console.error('Failed to delete design:', error);
          throw error;
        }
      },

      clearDesign: () => {
        set({
          elements: [],
          selectedElements: [],
          canvasBackgroundColor: '#FFFFFF',
          history: createHistoryState([]),
        });
      },
    })
  ); 