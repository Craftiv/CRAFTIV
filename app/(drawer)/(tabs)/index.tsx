import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CategoryTabs from '../../../components/CategoryTabs';
import Header from '../../../components/Header';
import Section from '../../../components/Section';
import TimeGoalPopup from '../../../components/TimeGoalPopup';
import { API_KEYS } from '../../../constants/apiKeys';
import { useAuth } from '../../../contexts/AuthContext';
import { useDesigns } from '../../../contexts/DesignContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTemplates } from '../../../hooks/useTemplates';
import { useDesignStore } from '../../../stores/designStore';
import { parseFigmaFrameToElements } from '../../../utils/figmaParser';

// Dummy data for other sections
const whiteboardData = [
  { id: '1', label: 'Whiteboard', image: 'https://placehold.co/120x90/fff/000?text=Whiteboard' },
  { id: '2', label: 'Whiteboard', image: 'https://placehold.co/120x90/fff/000?text=Whiteboard' },
];
const storyTemplatesData = [
  { id: '1', label: 'Instagram Story', image: 'https://placehold.co/120x90/FF6B9D/fff?text=Instagram' },
  { id: '2', label: 'Facebook Story', image: 'https://placehold.co/120x90/1877F2/fff?text=Facebook' },
  { id: '3', label: 'Snapchat Story', image: 'https://placehold.co/120x90/FFFC00/000?text=Snapchat' },
  { id: '4', label: 'TikTok Story', image: 'https://placehold.co/120x90/000000/fff?text=TikTok' },
];
const docsData = [
  { id: '1', label: 'Doc', image: 'https://placehold.co/120x90/ddd/000?text=Doc' },
  { id: '2', label: 'Doc', image: 'https://placehold.co/120x90/ddd/000?text=Doc' },
];

// Add DocTemplate type
interface DocTemplate {
  id: string;
  text: string;
  color: string;
  fontFamily: string;
  isBold: boolean;
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { recentDesigns } = useDesigns();
  const { templates, getTemplatesByCategory } = useTemplates();
  const router = useRouter();
  const [docsTemplates, setDocsTemplates] = useState<DocTemplate[]>([]);
  const [showTimeGoalPopup, setShowTimeGoalPopup] = useState(false);
  const { user } = useAuth();
  const [logoTemplates, setLogoTemplates] = useState<Array<{ id: string; label: string; name: string; image: string }>>([]);
  const designStore = useDesignStore();
  const [logoModalVisible, setLogoModalVisible] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<{ id: string; label: string; name: string; image: string } | null>(null);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('docsTemplates');
      if (stored) setDocsTemplates(JSON.parse(stored));
    })();
  }, []);

  // Check if user just logged in and show time goal popup
  useEffect(() => {
    const checkAndShowTimeGoal = async () => {
      try {
        const hasShownTimeGoal = await AsyncStorage.getItem('hasShownTimeGoal');
        if (!hasShownTimeGoal) {
          // Show popup after a short delay to let the screen load
          setTimeout(() => {
            setShowTimeGoalPopup(true);
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking time goal popup:', error);
      }
    };
    
    checkAndShowTimeGoal();
  }, []);

  useEffect(() => {
    async function fetchLogoTemplates() {
      try {
        const res = await fetch(`https://api.figma.com/v1/files/${API_KEYS.FIGMA_FILE_KEY}`, {
          headers: { 'X-Figma-Token': API_KEYS.FIGMA_TOKEN }
        });
        const data = await res.json();
        const frameNodes = [];
        for (const page of data.document.children || []) {
          for (const node of page.children || []) {
            if (node.type === 'FRAME') {
              frameNodes.push({ id: node.id, name: node.name });
            }
          }
        }
        // Pick frames 13, 14, 15, 16 (0-based index)
        const selectedFrames = [frameNodes[12], frameNodes[13], frameNodes[14], frameNodes[15]].filter(Boolean);
        const ids = selectedFrames.map(f => f.id).join(',');
        const imageRes = await fetch(`https://api.figma.com/v1/images/${API_KEYS.FIGMA_FILE_KEY}?ids=${ids}&format=png`, {
          headers: { 'X-Figma-Token': API_KEYS.FIGMA_TOKEN }
        });
        const imageData = await imageRes.json();
        const templates = selectedFrames.map(f => ({
          id: f.id,
          label: 'Logo',
          name: f.name,
          image: imageData.images[f.id] || ''
        }));
        setLogoTemplates(templates);
      } catch (e) {
        setLogoTemplates([]);
      }
    }
    fetchLogoTemplates();
  }, []);

  const handleTimeGoalClose = async () => {
    setShowTimeGoalPopup(false);
    // Mark that we've shown the popup
    try {
      await AsyncStorage.setItem('hasShownTimeGoal', 'true');
    } catch (error) {
      console.error('Error saving time goal popup state:', error);
    }
  };

  const handleSeeAllStories = () => {
    router.push('/YourStories' as any);
  };

  // Transform template data to match the expected format
  const transformTemplates = (templates: any[]) => {
    try {
      return templates.map(template => ({
        id: template.id,
        label: template.title,
        image: template.thumbnail,
      }));
    } catch (error) {
      console.error('Error transforming templates:', error);
      return [];
    }
  };

  // Get templates for different sections with error handling
  const flyerTemplates = transformTemplates(getTemplatesByCategory('Flyers'));
  const posterTemplates = transformTemplates(getTemplatesByCategory('Posters'));
  const cardTemplates = transformTemplates(getTemplatesByCategory('Cards & Invites'));
  const resumeTemplates = transformTemplates(getTemplatesByCategory('Resume'));
  const socialTemplates = transformTemplates(getTemplatesByCategory('Social Media'));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      
      <StatusBar barStyle="dark-content" />
      <Header />
      <ScrollView>
        <CategoryTabs />
        
        {/* AI Design Generator Button */}
        <LinearGradient
          colors={['#A78BFA', '#6366F1', '#60A5FA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiButtonGradient}
        >
          <TouchableOpacity
            style={styles.aiButtonNew}
            onPress={() => router.push('/(drawer)/AIDesignScreen')}
            activeOpacity={0.85}
          >
            <View style={styles.aiGlowIconWrap}>
              <View style={styles.aiGlow} />
              <Ionicons name="sparkles" size={36} color="#fff" style={{ zIndex: 2 }} />
            </View>
            <View style={styles.aiTextContainerNew}>
              <Text style={styles.aiButtonTitleNew}>✨ AI Design Magic</Text>
              <Text style={styles.aiButtonSubtitleNew}>Let AI spark your next creative masterpiece!</Text>
            </View>
            <View style={styles.aiArrowWrap}>
              <Ionicons name="arrow-forward-circle" size={32} color="#fff" />
            </View>
          </TouchableOpacity>
        </LinearGradient>
        
        {/* <QuickActions /> */}
        <Section title="Recent Designs" data={recentDesigns} showAddButton={true} />
        {/* Logo Section before Flyers */}
        <View style={{ marginVertical: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 6 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#6366F1' }}>Logo</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16 }}>
            {logoTemplates.map(item => (
              <TouchableOpacity
                key={item.id}
                style={{ marginRight: 16, alignItems: 'center', width: 100 }}
                onPress={() => {
                  setSelectedLogo(item);
                  setLogoModalVisible(true);
                }}
              >
                <Image
                  source={{ uri: item.image }}
                  style={{ width: 100, height: 150, borderRadius: 12, backgroundColor: '#eee' }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <Modal
          visible={logoModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLogoModalVisible(false)}
        >
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setLogoModalVisible(false)}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', maxWidth: 350, width: '90%' }}>
              {selectedLogo ? (
                <>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#23235B', textAlign: 'center' }}>{selectedLogo.name}</Text>
                  {selectedLogo.image ? (
                    <Image source={{ uri: selectedLogo.image }} style={{ width: 280, height: 280, borderRadius: 12, marginBottom: 20, backgroundColor: '#eee' }} resizeMode="contain" />
                  ) : (
                    <View style={{ width: 280, height: 280, borderRadius: 12, marginBottom: 20, backgroundColor: '#ccc', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#333', fontSize: 16 }}>No Image</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={{ backgroundColor: '#6366F1', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8, marginBottom: 12 }}
                    onPress={async () => {
                      if (!selectedLogo) return;
                      // Fetch and set elements for editing
                      const res = await fetch(`https://api.figma.com/v1/files/${API_KEYS.FIGMA_FILE_KEY}`, {
                        headers: { 'X-Figma-Token': API_KEYS.FIGMA_TOKEN }
                      });
                      const data = await res.json();
                      function findNode(node: any): any {
                        if (node.id === selectedLogo.id) return node;
                        if (node.children) {
                          for (const child of node.children) {
                            const found = findNode(child);
                            if (found) return found;
                          }
                        }
                        return null;
                      }
                      const frameNode = findNode(data.document);
                      if (!frameNode) return;
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
                      const elementsWithImages = elements.map((el: any, index: number) => {
                        let updated = { ...el };
                        if (el.type === 'image' && imageMap[el.id as keyof typeof imageMap]) {
                          let url = imageMap[el.id as keyof typeof imageMap];
                          url = url.replace(/^[^h]+(https?:\/\/)/, '$1');
                          (updated as any).uri = url;
                        }
                        updated.id = `${el.type}_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
                        return updated;
                      });
                      designStore.setElements(elementsWithImages);
                      setLogoModalVisible(false);
                      router.push({
                        pathname: '/(drawer)/TemplateEditScreen',
                        params: { templateName: selectedLogo.name, templateId: selectedLogo.id }
                      } as any);
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Edit in App</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </Pressable>
        </Modal>
        <Section title="Flyers" data={flyerTemplates} />
        <Section title="Posters" data={posterTemplates} />
        <Section title="Cards & Invites" data={cardTemplates} />
        <Section title="Resume" data={resumeTemplates} />
        <Section 
          title="Social Media" 
          data={socialTemplates} 
          onSeeAll={handleSeeAllStories}
        />
        <Section title="Docs" data={docsTemplates.map(t => ({ id: t.id, label: t.text ? t.text.slice(0, 20) + (t.text.length > 20 ? '...' : '') : 'Doc', image: '', preview: t.text }))} />
      </ScrollView>
      
      {/* Time Goal Popup */}
      <TimeGoalPopup 
        visible={showTimeGoalPopup} 
        onClose={handleTimeGoalClose} 
      />
    </View>
  );
}

export function HomeTab() {
  return (
    <View style={[styles.container, styles.centered]}>
      <Text style={styles.text}>Welcome to the Home Tab!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    columnGap: 10,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  designButton: {
    backgroundColor: '#FF2290',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  designButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  aiButton: {
    backgroundColor: '#6366F1',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  aiButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiTextContainer: {
    flex: 1,
  },
  aiButtonTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  aiButtonSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  aiButtonGradient: {
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 24,
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  aiButtonNew: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  aiGlowIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  aiGlow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    zIndex: 1,
  },
  aiTextContainerNew: {
    flex: 1,
  },
  aiButtonTitleNew: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  aiButtonSubtitleNew: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    fontWeight: '500',
  },
  aiArrowWrap: {
    marginLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});