import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type ExportQuality = 'low' | 'medium' | 'high';

interface SettingsContextProps {
  autoSave: boolean;
  setAutoSave: (value: boolean) => void;
  exportQuality: ExportQuality;
  setExportQuality: (value: ExportQuality) => void;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [autoSave, setAutoSaveState] = useState(true);
  const [exportQuality, setExportQualityState] = useState<ExportQuality>('high');

  useEffect(() => {
    (async () => {
      const savedAutoSave = await AsyncStorage.getItem('autoSave');
      const savedExportQuality = await AsyncStorage.getItem('exportQuality');
      if (savedAutoSave !== null) setAutoSaveState(savedAutoSave === 'true');
      if (savedExportQuality === 'low' || savedExportQuality === 'medium' || savedExportQuality === 'high') {
        setExportQualityState(savedExportQuality);
      }
    })();
  }, []);

  const setAutoSave = async (value: boolean) => {
    setAutoSaveState(value);
    await AsyncStorage.setItem('autoSave', value.toString());
  };

  const setExportQuality = async (value: ExportQuality) => {
    setExportQualityState(value);
    await AsyncStorage.setItem('exportQuality', value);
  };

  return (
    <SettingsContext.Provider value={{ autoSave, setAutoSave, exportQuality, setExportQuality }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
}; 