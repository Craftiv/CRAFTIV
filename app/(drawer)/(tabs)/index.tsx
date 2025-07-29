import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CategoryTabs from '../../../components/CategoryTabs';
import Header from '../../../components/Header';
import Section from '../../../components/Section';
import SkeletonSection from '../../../components/SkeletonSection';
import TimeGoalPopup from '../../../components/TimeGoalPopup';
import { API_KEYS } from '../../../constants/apiKeys';
import { useAuth } from '../../../contexts/AuthContext';
import { useDesigns } from '../../../contexts/DesignContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTemplates } from '../../../hooks/useTemplates';
import { useDesignStore } from '../../../stores/designStore';

// Template categories with their frame indices (0-based)
const TEMPLATE_CATEGORIES = {
  LOGO: [12, 13, 14, 15], // Frames 13, 14, 15, 16 (0-based)
  FLYERS: [1, 17, 31, 34], // Template 2, 18, 32, 35 (0-based)
  POSTERS: [3, 5, 9, 34, 35], // Template 4, 6, 10, 35, 36 (0-based)
  CARDS_INVITES: [31, 1, 17, 23, 36], // Template 32, 2, 18, 24, 37 (0-based)
  RESUME: [20, 21, 22, 23, 24], // Template 21, 22, 23, 24, 25 (0-based)
  SOCIAL_MEDIA: [31, 32, 33, 34, 35], // Template 32, 33, 34, 35, 36 (0-based)
  DOCS: [2, 7, 8, 22], // Template 3, 8, 9, 23 (0-based)
};

// Add DocTemplate type
interface DocTemplate {
  id: string;
  text: string;
  color: string;
  fontFamily: string;
  isBold: boolean;
}

interface TemplateItem {
  id: string;
  label: string;
  name: string;
  image: string;
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { recentDesigns } = useDesigns();
  const { templates, getTemplatesByCategory } = useTemplates();
  const router = useRouter();
  const [docsTemplates, setDocsTemplates] = useState<DocTemplate[]>([]);
  const [showTimeGoalPopup, setShowTimeGoalPopup] = useState(false);
  const { user } = useAuth();
  const [logoTemplates, setLogoTemplates] = useState<TemplateItem[]>([]);
  const [flyerTemplatesState, setFlyerTemplatesState] = useState<TemplateItem[]>([]);
  const [posterTemplatesState, setPosterTemplatesState] = useState<TemplateItem[]>([]);
  const [cardTemplatesState, setCardTemplatesState] = useState<TemplateItem[]>([]);
  const [resumeTemplatesState, setResumeTemplatesState] = useState<TemplateItem[]>([]);
  const [socialTemplatesState, setSocialTemplatesState] = useState<TemplateItem[]>([]);
  const [docsTemplatesFigma, setDocsTemplatesFigma] = useState<TemplateItem[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingLogo, setIsLoadingLogo] = useState(true);
  const [isLoadingFlyers, setIsLoadingFlyers] = useState(true);
  const [isLoadingPosters, setIsLoadingPosters] = useState(true);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [isLoadingResume, setIsLoadingResume] = useState(true);
  const [isLoadingSocial, setIsLoadingSocial] = useState(true);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const designStore = useDesignStore();

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
    async function fetchAllTemplates() {
      try {
        setIsLoadingTemplates(true);
        const res = await fetch(`https://api.figma.com/v1/files/${API_KEYS.FIGMA_FILE_KEY}`, {
          headers: { 'X-Figma-Token': API_KEYS.FIGMA_TOKEN }
        });
        const data = await res.json();
        const frameNodes: Array<{ id: string; name: string }> = [];
        for (const page of data.document.children || []) {
          for (const node of page.children || []) {
            if (node.type === 'FRAME') {
              frameNodes.push({ id: node.id, name: node.name });
            }
          }
        }

        // Helper function to fetch templates for a category
        const fetchTemplatesForCategory = async (categoryName: string, indices: number[]) => {
          const selectedFrames = indices.map(index => frameNodes[index]).filter(Boolean);
          if (selectedFrames.length === 0) return [];
          
          const ids = selectedFrames.map(f => f.id).join(',');
          const imageRes = await fetch(`https://api.figma.com/v1/images/${API_KEYS.FIGMA_FILE_KEY}?ids=${ids}&format=png`, {
            headers: { 'X-Figma-Token': API_KEYS.FIGMA_TOKEN }
          });
          const imageData = await imageRes.json();
          return selectedFrames.map(f => ({
            id: f.id,
            label: categoryName,
            name: f.name,
            image: imageData.images[f.id] || ''
          }));
        };

        // Fetch templates for all categories
        const [
          logoTemplatesData,
          flyerTemplatesData,
          posterTemplatesData,
          cardTemplatesData,
          resumeTemplatesData,
          socialTemplatesData,
          docsTemplatesData
        ] = await Promise.all([
          fetchTemplatesForCategory('Logo', TEMPLATE_CATEGORIES.LOGO),
          fetchTemplatesForCategory('Flyers', TEMPLATE_CATEGORIES.FLYERS),
          fetchTemplatesForCategory('Posters', TEMPLATE_CATEGORIES.POSTERS),
          fetchTemplatesForCategory('Cards & Invites', TEMPLATE_CATEGORIES.CARDS_INVITES),
          fetchTemplatesForCategory('Resume', TEMPLATE_CATEGORIES.RESUME),
          fetchTemplatesForCategory('Social Media', TEMPLATE_CATEGORIES.SOCIAL_MEDIA),
          fetchTemplatesForCategory('Docs', TEMPLATE_CATEGORIES.DOCS)
        ]);

        setLogoTemplates(logoTemplatesData);
        setFlyerTemplatesState(flyerTemplatesData);
        setPosterTemplatesState(posterTemplatesData);
        setCardTemplatesState(cardTemplatesData);
        setResumeTemplatesState(resumeTemplatesData);
        setSocialTemplatesState(socialTemplatesData);
        setDocsTemplatesFigma(docsTemplatesData);
        
        // Set loading states to false
        setIsLoadingLogo(false);
        setIsLoadingFlyers(false);
        setIsLoadingPosters(false);
        setIsLoadingCards(false);
        setIsLoadingResume(false);
        setIsLoadingSocial(false);
        setIsLoadingDocs(false);
        setIsLoadingTemplates(false);
      } catch (e) {
        console.error('Error fetching templates:', e);
        setLogoTemplates([]);
        setFlyerTemplatesState([]);
        setPosterTemplatesState([]);
        setCardTemplatesState([]);
        setResumeTemplatesState([]);
        setSocialTemplatesState([]);
        setDocsTemplatesFigma([]);
        
        // Set loading states to false on error
        setIsLoadingLogo(false);
        setIsLoadingFlyers(false);
        setIsLoadingPosters(false);
        setIsLoadingCards(false);
        setIsLoadingResume(false);
        setIsLoadingSocial(false);
        setIsLoadingDocs(false);
        setIsLoadingTemplates(false);
      }
    }
    fetchAllTemplates();
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
        
        {/* Logo Section */}
        {isLoadingLogo ? (
          <SkeletonSection title="Logo" count={4} />
        ) : (
          <Section title="Logo" data={logoTemplates} />
        )}
        
        {/* Template Sections */}
        {isLoadingFlyers ? (
          <SkeletonSection title="Flyers" count={4} />
        ) : (
          <Section title="Flyers" data={flyerTemplatesState} />
        )}
        
        {isLoadingPosters ? (
          <SkeletonSection title="Posters" count={5} />
        ) : (
          <Section title="Posters" data={posterTemplatesState} />
        )}
        
        {isLoadingCards ? (
          <SkeletonSection title="Cards & Invites" count={5} />
        ) : (
          <Section title="Cards & Invites" data={cardTemplatesState} />
        )}
        
        {isLoadingResume ? (
          <SkeletonSection title="Resume" count={5} />
        ) : (
          <Section title="Resume" data={resumeTemplatesState} />
        )}
        
        {isLoadingSocial ? (
          <SkeletonSection title="Social Media" count={5} />
        ) : (
          <Section 
            title="Social Media" 
            data={socialTemplatesState} 
            onSeeAll={handleSeeAllStories}
          />
        )}
        
        {isLoadingDocs ? (
          <SkeletonSection title="Docs" count={4} />
        ) : (
          <Section title="Docs" data={docsTemplatesFigma.map(t => ({ id: t.id, label: t.name, image: t.image }))} />
        )}
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