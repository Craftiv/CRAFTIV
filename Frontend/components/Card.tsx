import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDesignStore } from '../stores/designStore';

interface CardProps {
  item: any;
  isAddButton?: boolean;
}

export default function Card({ item, isAddButton = false }: CardProps) {
  const router = useRouter();
  const { clearDesign, loadDesignById } = useDesignStore();

  const handleAddDesign = () => {
    // Clear any existing design to start fresh
    clearDesign();
    router.push('CanvaDesignPage' as any);
  };

  const handleEditDesign = async () => {
    try {
      
      // Load the specific design into the store
      const success = await loadDesignById(item.id);
      
      if (success) {
        // Navigate to the design page for editing
        router.push('/CanvaDesignPage' as any);
      } else {
        console.error('Failed to load design - design not found in storage');
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
      {/* Removed the label text to hide small titles under templates */}
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