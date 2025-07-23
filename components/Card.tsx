import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDesigns } from '../contexts/DesignContext';
import { useDesignStore } from '../stores/designStore';

interface CardProps {
  item: any;
  isAddButton?: boolean;
}

export default function Card({ item, isAddButton = false }: CardProps) {
  const router = useRouter();
  const { clearDesign, loadDesignById } = useDesignStore();
  const { getDesignById } = useDesigns();

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
        
        // Navigate to CanvaDesignPage with design data
        router.push({
          pathname: '/CanvaDesignPage' as any,
          params: { 
            edit: item.id,
            designData: JSON.stringify(design.elements),
            canvasBgColor: design.canvasBackgroundColor || '#fff'
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

  const handleTemplateSelect = () => {
    // For template items, navigate to design page with template data
    clearDesign();
    // You can pass template data through navigation params or store it
    router.push({
      pathname: '/CanvaDesignPage' as any,
      params: { template: JSON.stringify(item) }
    });
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

  // Check if this is a template item (has image with picsum URL)
  const isTemplate = item.image && (item.image.includes('picsum') || item.image.includes('placeholder'));

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={isTemplate ? handleTemplateSelect : handleEditDesign}
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
      {/* Show label for recent designs, hide for templates */}
      {!isTemplate && item.label && (
        <Text style={styles.label} numberOfLines={1}>
          {item.label}
        </Text>
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
  label: { padding: 8, fontSize: 14, color: '#333' }
});