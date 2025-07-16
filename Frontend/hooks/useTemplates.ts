import { useState } from 'react';
import { getAllTemplates, getTemplatesByCategory, TemplateCategory, TEMPLATES } from '../services/templateService';

export function useTemplates() {
  // No loading or error state needed, just return the mock data
  const [templates] = useState<TemplateCategory[]>(TEMPLATES);

  return {
    templates,
    getTemplatesByCategory,
    getAllTemplates,
  };
} 