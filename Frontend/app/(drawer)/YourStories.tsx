import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Conditionally import ViewShot for web compatibility
let ViewShot: any;
if (Platform.OS !== 'web') {
  try {
    ViewShot = require('react-native-view-shot').default;
  } catch (error) {
    console.warn('react-native-view-shot not available:', error);
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDesigns } from '../../contexts/DesignContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useDesignStore } from '../../stores/designStore';

// Add this component at the top of the file
const DesignPreview = ({ elements, canvasBackgroundColor, canvasWidth = 420, canvasHeight = 483 }: { elements: any[]; canvasBackgroundColor?: string; canvasWidth?: number; canvasHeight?: number }) => {
  // Set preview size and scale
  const previewWidth = 100;
  const previewHeight = Math.round((canvasHeight / canvasWidth) * previewWidth);
  const scaleX = previewWidth / canvasWidth;
  const scaleY = previewHeight / canvasHeight;

  return (
    <View
      style={{
        width: previewWidth,
        height: previewHeight,
        backgroundColor: canvasBackgroundColor || '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
      }}
    >
      {elements && elements.map((el, idx) => {
        if (el.type === 'rectangle') {
          return (
            <View
              key={el.id || idx}
              style={{
                position: 'absolute',
                left: el.x * scaleX,
                top: el.y * scaleY,
                width: (el.width || 60) * scaleX,
                height: (el.height || 40) * scaleY,
                backgroundColor: el.color || el.backgroundColor || '#1976D2',
                borderRadius: 4,
                borderWidth: 1,
                borderColor: '#bbb',
              }}
            />
          );
        }
        if (el.type === 'circle') {
          return (
            <View
              key={el.id || idx}
              style={{
                position: 'absolute',
                left: el.x * scaleX,
                top: el.y * scaleY,
                width: (el.width || 40) * scaleX,
                height: (el.height || 40) * scaleY,
                backgroundColor: el.color || el.backgroundColor || '#8e44ad',
                borderRadius: 999,
                borderWidth: 1,
                borderColor: '#bbb',
              }}
            />
          );
        }
        if (el.type === 'text') {
          return (
            <Text
              key={el.id || idx}
              style={{
                position: 'absolute',
                left: el.x * scaleX,
                top: el.y * scaleY,
                fontSize: (el.fontSize || 16) * scaleY,
                color: el.color || '#23235B',
                fontWeight: 'bold',
                fontFamily: el.fontFamily || 'System',
                maxWidth: previewWidth - 8,
              }}
              numberOfLines={1}
            >
              {el.text}
            </Text>
          );
        }
        if (el.type === 'image' && el.uri) {
          return (
            <Image
              key={el.id || idx}
              source={{ uri: el.uri }}
              style={{
                position: 'absolute',
                left: el.x * scaleX,
                top: el.y * scaleY,
                width: (el.width || 40) * scaleX,
                height: (el.height || 40) * scaleY,
                borderRadius: 6,
              }}
              resizeMode="cover"
            />
          );
        }
        return null;
      })}
    </View>
  );
};

interface Story {
  id: string;
  title: string;
  imageUri: string;
  date: string;
  designData: any;
}

export default function YourStories() {
  const { recentDesigns, deleteDesign } = useDesigns();
  const { loadDesignById, deleteDesignById, clearDesign } = useDesignStore();
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null);
  const viewShotRef = useRef<any>(null);
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showStoryModal, setShowStoryModal] = useState(false);

  // Load saved stories on component mount
  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      console.log('YourStories: Loading stories from AsyncStorage...');
      const savedStories = await AsyncStorage.getItem('yourStories');
      console.log('YourStories: Raw saved stories:', savedStories);
      if (savedStories) {
        const parsedStories = JSON.parse(savedStories);
        console.log('YourStories: Parsed stories:', parsedStories);
        console.log('YourStories: Number of stories:', parsedStories.length);
        console.log('YourStories: First story structure:', parsedStories[0]);
        setStories(parsedStories);
      } else {
        console.log('YourStories: No saved stories found');
      }
    } catch (error: any) {
      console.error('YourStories: Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStories();
    setRefreshing(false);
  };

  const handleDesignPress = async (designId: string) => {
    try {
      console.log('YourStories: Attempting to load design with ID:', designId);
      
      // Find the story in the current stories array
      const story = stories.find(s => s.id === designId);
      
      if (story && story.designData) {
        // Clear any existing design
        clearDesign();
        
        // Navigate to CanvaDesignPage with design data
        router.push({
          pathname: '/CanvaDesignPage' as any,
          params: { 
            edit: designId,
            designData: JSON.stringify(story.designData),
            canvasBgColor: story.designData.canvasBgColor || '#fff'
          }
        });
      } else {
        console.error('YourStories: Failed to load design - design not found in stories');
        Alert.alert('Error', 'Failed to load design - design not found');
      }
    } catch (error) {
      console.error('YourStories: Error loading design:', error);
      Alert.alert('Error', 'Failed to load design');
    }
  };

  const handleStoryPress = (story: Story) => {
    setSelectedStory(story);
    setShowStoryModal(true);
  };

  const handleDownload = async () => {
    if (!selectedStory) return;
    
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(selectedStory.imageUri);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedStory.title}.png`;
        a.click();
        window.URL.revokeObjectURL(url);
        Alert.alert('Downloaded!', 'Design saved to your device.');
      } else {
        await Sharing.shareAsync(selectedStory.imageUri);
      }
    } catch (error: any) {
      Alert.alert('Download failed', error.message);
    }
  };

  const handleDelete = (designId: string) => {
    Alert.alert(
      'Delete Design',
      'Are you sure you want to delete this design?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from recent designs list
              deleteDesign(designId);
              
              // Delete from YourStories storage
              const updatedStories = stories.filter(story => story.id !== designId);
              await AsyncStorage.setItem('yourStories', JSON.stringify(updatedStories));
              setStories(updatedStories);
              
              Alert.alert('Success', 'Design deleted successfully');
            } catch (error) {
              console.error('Error deleting design:', error);
              Alert.alert('Error', 'Failed to delete design');
            }
          },
        },
      ]
    );
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      const updatedStories = stories.filter(story => story.id !== storyId);
      await AsyncStorage.setItem('yourStories', JSON.stringify(updatedStories));
      setStories(updatedStories);
      setShowStoryModal(false);
      setSelectedStory(null);
    } catch (error: any) {
      Alert.alert('Delete failed', error.message);
    }
  };

  const renderDesignItem = ({ item }: { item: any }) => (
    <View style={styles.designCard}>
      <TouchableOpacity
        style={styles.designImage}
        onPress={() => handleDesignPress(item.id)}
      >
        {item.designData && (item.designData.canvasShapes?.length > 0 || item.designData.canvasImages?.length > 0 || item.designData.canvasTexts?.length > 0) ? (
          <DesignPreview 
            elements={[
              ...(item.designData.canvasShapes || []),
              ...(item.designData.canvasImages || []),
              ...(item.designData.canvasTexts || [])
            ]} 
            canvasBackgroundColor={item.designData.canvasBgColor} 
          />
        ) : item.imageUri ? (
          <Image
            source={{ uri: item.imageUri }}
            style={styles.capturedImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageText}>{item.title || 'Design'}</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <View style={styles.designInfo}>
        <Text style={styles.designTitle} numberOfLines={1}>
          {item.title || 'Untitled Design'}
        </Text>
        <Text style={styles.designDate}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDownload}
        >
          <Ionicons name="download" size={20} color="#007AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Your Stories</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Designs List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textSecondary }}>Loading your designs...</Text>
        </View>
      ) : stories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No designs yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Create designs in other screens and save them here
          </Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.storiesGrid}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {stories.map((story: Story) => (
            <TouchableOpacity
              key={story.id}
              style={styles.storyCard}
              onPress={() => handleStoryPress(story)}
            >
              <Image source={{ uri: story.imageUri }} style={styles.storyThumbnail} resizeMode="cover" />
              <View style={styles.storyInfo}>
                <Text style={[styles.storyTitle, { color: colors.text }]} numberOfLines={1}>
                  {story.title}
                </Text>
                <Text style={[styles.storyDate, { color: colors.textSecondary }]}>
                  {new Date(story.date).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Hidden ViewShot for capturing designs */}
      {ViewShot && (
        <ViewShot ref={viewShotRef} style={styles.hiddenView}>
          <View style={styles.captureView}>
            {/* This will be used to capture designs */}
          </View>
        </ViewShot>
      )}

      {/* Story Detail Modal */}
      {showStoryModal && selectedStory && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedStory.title}</Text>
              <TouchableOpacity onPress={() => setShowStoryModal(false)}>
                <Ionicons name="close" size={24} color="#23235B" />
              </TouchableOpacity>
            </View>
            <Image source={{ uri: selectedStory.imageUri }} style={styles.modalImage} resizeMode="contain" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.downloadBtnText}>Download</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteStory(selectedStory.id)}>
                <Ionicons name="trash-outline" size={20} color="#fff" />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  designCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  designImage: {
    marginBottom: 0,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  imageText: {
    fontSize: 18,
    color: '#6C757D',
    fontWeight: '500',
  },
  designInfo: {
    padding: 16,
    paddingBottom: 12,
  },
  designTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 6,
  },
  designDate: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  deleteButton: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FECACA',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  hiddenView: {
    position: 'absolute',
    top: -1000,
    left: -1000,
  },
  captureView: {
    width: 300,
    height: 200,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flexDirection: 'column',
    marginLeft: 16,
  },
  createButton: {
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginTop: 16,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  capturedImage: {
    width: '100%',
    height: 200,
    borderRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  storiesGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  storyCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storyThumbnail: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  storyInfo: {
    padding: 12,
  },
  storyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  storyDate: {
    fontSize: 12,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#23235B',
  },
  modalImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  downloadBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deleteBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  refreshButton: {
    padding: 8,
  },
}); 