import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface DesignData {
  id: string;
  label: string;
  image: string;
  createdAt: Date;
  isCompleted: boolean;
  content?: string;
  elements?: any[]; // Add this for full design preview
  canvasBackgroundColor?: string; // Add this for full design preview
}

interface DesignContextType {
  recentDesigns: DesignData[];
  getDesignById: (id: string) => DesignData | undefined;
  addDesign: (design: Omit<DesignData, 'id' | 'createdAt'> & { id?: string }) => void;
  updateDesign: (id: string, updates: Partial<DesignData>) => void;
  deleteDesign: (id: string) => void;
  clearDesigns: () => void;
  clearAllDesignData: () => Promise<void>;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export const useDesigns = () => {
  const context = useContext(DesignContext);
  if (!context) {
    throw new Error('useDesigns must be used within a DesignProvider');
  }
  return context;
};

interface DesignProviderProps {
  children: ReactNode;
}

export const DesignProvider: React.FC<DesignProviderProps> = ({ children }) => {
  const [recentDesigns, setRecentDesigns] = useState<DesignData[]>([]);

  // Load designs from AsyncStorage on app start
  useEffect(() => {
    loadDesigns();
    checkAndFixDesignIds();
  }, []);

  const loadDesigns = async () => {
    try {
      const storedDesigns = await AsyncStorage.getItem('recentDesigns');
      if (storedDesigns) {
        const designs = JSON.parse(storedDesigns);
        // Convert string dates back to Date objects
        const designsWithDates = designs.map((design: any) => ({
          ...design,
          createdAt: new Date(design.createdAt),
        }));
        setRecentDesigns(designsWithDates);
      }
    } catch (error) {
      console.error('Error loading designs:', error);
    }
  };

  const checkAndFixDesignIds = async () => {
    try {
      // Get all keys from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const designKeys = keys.filter(key => key.startsWith('design_'));
      
      console.log('Found design keys:', designKeys);
      
      // Check if any designs exist but are not in recentDesigns
      for (const key of designKeys) {
        const designId = key.replace('design_', '');
        const designExists = recentDesigns.find(design => design.id === designId);
        
        if (!designExists) {
          console.log('Found orphaned design:', designId);
          // Optionally, we could add it back to recentDesigns or delete it
          // For now, just log it for debugging
        }
      }
    } catch (error) {
      console.error('Error checking design IDs:', error);
    }
  };

  const saveDesigns = async (designs: DesignData[]) => {
    try {
      await AsyncStorage.setItem('recentDesigns', JSON.stringify(designs));
    } catch (error) {
      console.error('Error saving designs:', error);
    }
  };

  const getDesignById = (id: string) => {
    return recentDesigns.find(design => design.id === id);
  };

  const addDesign = (designData: Omit<DesignData, 'id' | 'createdAt'> & { id?: string }) => {
    const newDesign: DesignData = {
      ...designData,
      id: designData.id || Date.now().toString(),
      createdAt: new Date(),
    };

    const updatedDesigns = [newDesign, ...recentDesigns].slice(0, 10); // Keep only 10 most recent
    setRecentDesigns(updatedDesigns);
    saveDesigns(updatedDesigns);
  };

  const updateDesign = (id: string, updates: Partial<DesignData>) => {
    const updatedDesigns = recentDesigns.map(design =>
      design.id === id ? { ...design, ...updates } : design
    );
    setRecentDesigns(updatedDesigns);
    saveDesigns(updatedDesigns);
  };

  const deleteDesign = (id: string) => {
    const updatedDesigns = recentDesigns.filter(design => design.id !== id);
    setRecentDesigns(updatedDesigns);
    saveDesigns(updatedDesigns);
  };

  const clearDesigns = () => {
    setRecentDesigns([]);
    saveDesigns([]);
  };

  const clearAllDesignData = async () => {
    try {
      // Clear recent designs
      setRecentDesigns([]);
      await AsyncStorage.removeItem('recentDesigns');
      
      // Clear all design content from storage
      const keys = await AsyncStorage.getAllKeys();
      const designKeys = keys.filter(key => key.startsWith('design_'));
      
      if (designKeys.length > 0) {
        await AsyncStorage.multiRemove(designKeys);
        console.log('Cleared design content for keys:', designKeys);
      }
      
      console.log('All design data cleared successfully');
    } catch (error) {
      console.error('Error clearing all design data:', error);
      throw error;
    }
  };

  const value: DesignContextType = {
    recentDesigns,
    getDesignById,
    addDesign,
    updateDesign,
    deleteDesign,
    clearDesigns,
    clearAllDesignData,
  };

  return (
    <DesignContext.Provider value={value}>
      {children}
    </DesignContext.Provider>
  );
}; 