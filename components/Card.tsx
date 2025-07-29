import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_KEYS } from '../constants/apiKeys';
import { useDesigns } from '../contexts/DesignContext';
import { useDesignStore } from '../stores/designStore';
import { parseFigmaFrameToElements } from '../utils/figmaParser';

interface CardProps {
  item: any;
  isAddButton?: boolean;
}

export default function Card({ item, isAddButton = false }: CardProps) {
  const router = useRouter();
  const { clearDesign, loadDesignById } = useDesignStore();
  const { getDesignById } = useDesigns();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddDesign = () => {
    // Clear any existing design to start fresh
    clearDesign();
    
    // Clear any cached data from AsyncStorage
    AsyncStorage.removeItem('design_data').catch(console.error);
    
    // Always open a new CanvaDesignPage instance with unique parameter
    const unique = Date.now();
    router.push({ pathname: '/CanvaDesignPage', params: { new: unique.toString() } } as any);
  };

  const handleEditDesign = async () => {
    try {
      // Get the design from DesignContext
      const design = getDesignById(item.id);
      
      if (design && design.elements) {
        // Clear any existing design
        clearDesign();
        
        // Navigate to TemplateEditScreen with design data
        router.push({
          pathname: '/(drawer)/TemplateEditScreen',
          params: {
            edit: item.id,
            templateName: design.label,
            elements: JSON.stringify(design.elements),
            canvasBgColor: design.canvasBackgroundColor || '#fff',
          }
        });
      } else {
        console.error('Failed to load design - design not found in context');
        Alert.alert('Error', 'Failed to load design - design not found');
      }
    } catch (error) {
      console.error('Error loading design:', error);
      Alert.alert('Error', 'Failed to load design');
    }
  };

  const handleTemplateSelect = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      // For Figma template items, fetch the template data and navigate to edit screen
      clearDesign();
      
      // Fetch template data from Figma API
      const res = await fetch(`https://api.figma.com/v1/files/${API_KEYS.FIGMA_FILE_KEY}`, {
        headers: { 'X-Figma-Token': API_KEYS.FIGMA_TOKEN }
      });
      const data = await res.json();
      
      // Find the template node
      function findNode(node: any): any {
        if (node.id === item.id) return node;
        if (node.children) {
          for (const child of node.children) {
            const found = findNode(child);
            if (found) return found;
          }
        }
        return null;
      }
      
      const frameNode = findNode(data.document);
      if (!frameNode) {
        Alert.alert('Error', 'Template not found');
        return;
      }
      
      // Parse the frame to elements
      const elements = parseFigmaFrameToElements(frameNode);
      
      // Fetch image URLs for image elements
      const imageElements = elements.filter((el: any) => el.type === 'image');
      const imageIds = imageElements.map((el: any) => el.id);
      let imageMap: Record<string, string> = {};
      
      if (imageIds.length > 0) {
        const imageRes = await fetch(
          `https://api.figma.com/v1/images/${API_KEYS.FIGMA_FILE_KEY}?ids=${imageIds.join(',')}&format=png`,
          { headers: { 'X-Figma-Token': API_KEYS.FIGMA_TOKEN } }
        );
        const imageData = await imageRes.json();
        imageMap = imageData.images || {};
      }
      
      // Update elements with image URLs
      const elementsWithImages = elements.map((el: any) => {
        let updated = { ...el };
        if (el.type === 'image' && imageMap[el.id as keyof typeof imageMap]) {
          let url = imageMap[el.id as keyof typeof imageMap];
          url = url.replace(/^[^h]+(https?:\/\/)/, '$1');
          (updated as any).uri = url;
        }
        // Preserve original IDs from Figma, don't regenerate
        return updated;
      });
      
      // Set elements in design store
      const designStore = useDesignStore.getState();
      designStore.setElements(elementsWithImages);
      
      // Navigate to template edit screen
      router.push({
        pathname: '/(drawer)/TemplateEditScreen',
        params: { 
          templateName: item.name || item.label, 
          templateId: item.id 
        }
      } as any);
      
    } catch (error) {
      console.error('Error loading template:', error);
      Alert.alert('Error', 'Failed to load template');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAddButton) {
    return (
      <TouchableOpacity style={styles.card} onPress={handleAddDesign}>
        <View style={styles.addButtonImage}>
          <Ionicons name="add" size={32} color="#FFB6E6" />
        </View>
        <Text style={styles.label}>Add Design</Text>
      </TouchableOpacity>
    );
  }

  // Check if this is a template item (has image with picsum URL or is a Figma template)
  const isTemplate = item.image && (
    item.image.includes('picsum') || 
    item.image.includes('placeholder') ||
    item.image.includes('figma.com') ||
    item.name || // Figma templates have a 'name' property
    (item.label && ['Logo', 'Flyers', 'Posters', 'Cards & Invites', 'Resume', 'Social Media', 'Docs'].includes(item.label))
  );

  return (
    <TouchableOpacity 
      style={[styles.card, isLoading && styles.cardDisabled]} 
      onPress={isTemplate ? handleTemplateSelect : handleEditDesign}
      disabled={isLoading}
    >
      {item.image ? (
        <Image 
          source={{ uri: item.image }} 
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontSize: 12, color: '#999' }}>No Image</Text>
        </View>
      )}
      {/* Show loading indicator or label */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#6366F1" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        !isTemplate && item.label && (
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
        )
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { 
    width: 100, // keep width
    height: 150, // match image height
    marginRight: 12, 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    overflow: 'hidden', 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: { width: '100%', height: 150 }, // increased from 120
  addButtonImage: { 
    width: '100%', 
    height: 150, // increased from 120
    backgroundColor: '#F8F8F8', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFB6E6',
    borderStyle: 'dashed',
  },
  label: { padding: 8, fontSize: 14, color: '#333' },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6366F1',
  },
  cardDisabled: {
    opacity: 0.7,
    pointerEvents: 'none',
  },
});