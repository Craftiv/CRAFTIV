import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CategoryTabs from '../../../components/CategoryTabs';
import Header from '../../../components/Header';
import Section from '../../../components/Section';
import TimeGoalPopup from '../../../components/TimeGoalPopup';
import { useDesigns } from '../../../contexts/DesignContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTemplates } from '../../../hooks/useTemplates';

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
  const { templates, loading, error, getTemplatesByCategory } = useTemplates();
  const router = useRouter();
  const [docsTemplates, setDocsTemplates] = useState<DocTemplate[]>([]);
  const [showTimeGoalPopup, setShowTimeGoalPopup] = useState(false);

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
  const bannerTemplates = transformTemplates(getTemplatesByCategory('Banners & Ads'));
  const socialTemplates = transformTemplates(getTemplatesByCategory('Social Media'));

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text }}>Loading templates...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text }}>Error loading templates: {error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      
      <StatusBar barStyle="dark-content" />
      <Header />
      <ScrollView>
        <CategoryTabs />
        
        {/* AI Design Generator Button */}
        <TouchableOpacity 
          style={styles.aiButton}
          onPress={() => router.push('/(drawer)/AIDesignScreen')}
          activeOpacity={0.8}
        >
          <View style={styles.aiButtonContent}>
            <View style={styles.aiIconContainer}>
              <Ionicons name="sparkles" size={24} color="#fff" />
            </View>
            <View style={styles.aiTextContainer}>
              <Text style={styles.aiButtonTitle}>✨ Start with AI</Text>
              <Text style={styles.aiButtonSubtitle}>Generate designs with AI assistance</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
        
        {/* <QuickActions /> */}
        <Section title="Recent Designs" data={recentDesigns} showAddButton={true} />
        <Section title="Flyers" data={flyerTemplates} />
        <Section title="Posters" data={posterTemplates} />
        <Section title="Cards & Invites" data={cardTemplates} />
        <Section title="Banners & Ads" data={bannerTemplates} />
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
});