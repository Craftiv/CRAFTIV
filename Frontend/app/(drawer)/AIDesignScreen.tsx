import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useAIDesignStore } from '../../stores/aiDesignStore';

export default function AIDesignScreen() {
  const router = useRouter();
  const { 
    prompt, 
    setPrompt, 
    isLoading, 
    error, 
    generateDesign, 
    clearState 
  } = useAIDesignStore();
  
  const [localPrompt, setLocalPrompt] = useState(prompt);

  const handleGenerate = async () => {
    if (!localPrompt.trim()) {
      Alert.alert('Error', 'Please describe your design idea');
      return;
    }

    Keyboard.dismiss();
    
    try {
      const result = await generateDesign(localPrompt);
      if (result) {
        // Navigate to CanvaDesignPage with the AI-generated design data
        router.push({
          pathname: '/(drawer)/CanvaDesignPage',
          params: { 
            template: JSON.stringify(result),
            isAIGenerated: 'true'
          }
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate design. Please try again.');
    }
  };

  const handleBack = () => {
    clearState();
    router.back();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#23235B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Design Assistant</Text>
          <View style={{ width: 24 }} /> {/* Spacer for symmetry */}
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* AI Icon and Description */}
          <View style={styles.aiSection}>
            <View style={styles.aiIconContainer}>
              <Ionicons name="sparkles" size={48} color="#6366F1" />
            </View>
            <Text style={styles.aiTitle}>AI Design Generator</Text>
            <Text style={styles.aiDescription}>
              Describe your design idea and let AI create it for you. 
              Be as detailed as possible for better results.
            </Text>
          </View>

          {/* Prompt Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Describe your design idea</Text>
            <TextInput
              style={styles.textInput}
              value={localPrompt}
              onChangeText={setLocalPrompt}
              placeholder="e.g., A modern business card for a tech startup with blue and white colors, including company logo and contact information..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {localPrompt.length}/500 characters
            </Text>
          </View>

          {/* Voice Input Button (Optional Enhancement) */}
          <TouchableOpacity style={styles.voiceButton}>
            <Ionicons name="mic" size={20} color="#6366F1" />
            <Text style={styles.voiceButtonText}>Voice Input</Text>
          </TouchableOpacity>

          {/* Generate Button */}
          <TouchableOpacity
            style={[
              styles.generateButton,
              (!localPrompt.trim() || isLoading) && styles.generateButtonDisabled
            ]}
            onPress={handleGenerate}
            disabled={!localPrompt.trim() || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.generateButtonText}>Generating...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#fff" />
                <Text style={styles.generateButtonText}>Generate Design</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Tips Section */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>💡 Tips for better results:</Text>
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>• Be specific about colors, fonts, and style</Text>
              <Text style={styles.tipItem}>• Mention the purpose (business card, poster, etc.)</Text>
              <Text style={styles.tipItem}>• Include any specific elements you want</Text>
              <Text style={styles.tipItem}>• Describe the mood or feeling you want to convey</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#23235B',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  aiSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  aiIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#23235B',
    marginBottom: 8,
  },
  aiDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#23235B',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#23235B',
    backgroundColor: '#fafafa',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 25,
    marginBottom: 24,
    alignSelf: 'center',
  },
  voiceButtonText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
    marginLeft: 8,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginLeft: 8,
    flex: 1,
  },
  tipsSection: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#23235B',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 